<?php
require_once 'BookModel.php';
// require_once 'ModelHelperFunction.php';
require_once './src/error.php';
require_once 'src/success.php';

function getRequestNumber($docType, $data, $buttonType, $manager) {
  global $db;
  global $notSend;
  global $isOpenBookAfterSeptember;
  global $isOpenBookAfterSeptemberSending;
  $data["numrequest"] = null;
  $pipelineId = $data["pipeline_id"];
  $status_id = $data["status_id"];
  $bookingModel = [
    "lead_id" => $data['card_id'],
    "san_id" => $data["sanid"],
    "Дата заезда" => $data["data_zaezda"],
    "Дата выезда" => $data["data_vyezda"],
    "Количество дней" => $data["kolichestvo_dney"],
    "Категория номера" => $data["tip_nomera"],
    "Количество номеров" => $data["kolichestvo_nomerov"],
    "Примечание в заявке" => $data["primechanie_v_zayavke"],
    "На кого составляется договор" => $data["turist_dogovor_fio_pasport_propiska"],
    "Туроператор" => $data['idtouroperator'],
    "Гости" => $data["prilozhenie"]
  ];
  $books = getActiveBooks($data['card_id']);
  $currentSanBook = array_filter($books, 'filterBooksBySan');
  $currentSanBook = $currentSanBook[count($currentSanBook) - 1];
  list($isSame, $notSameDetails) = matchCurrentAndExistForBook(json_encode($bookingModel), $currentSanBook["payload"]);

  // Заявка отправлена, тип документа Аннуляция и тип кнопки отправить?
  if($currentSanBook and $docType == 4 and $buttonType == "send") {
    annulBook($data['card_id'], $data["sanid"]);
    return [$currentSanBook["id"]];
  }

  // Кнопка актуализации инфо в системе?
  if($docType == 2 and $buttonType == 'actualize') {
    changeBook($bookingModel, $currentSanBook["id"]);
    printSuccess("Данные по заявке обновлены, но номер заявки не меняли. Заявку/корректировку/уточнение/аннуляцию не отправляли.");
    exit;
  }

  // Если есть бронирование ветлива
  if($currentSanBook and $currentSanBook['type'] == 'vetliva') {
    //changeBook($bookingModel, $currentSanBook["id"]);
    return [$currentSanBook["id"]];
  }

  if($docType == 1 && $currentSanBook['type'] == 'not sended') {
    changeBook($bookingModel, $currentSanBook["id"]);
    return [$currentSanBook["id"]];
  }

  // Если есть бронирование с исключением или есть бронирование после сентября
  if(((!$notSend and $currentSanBook['type'] == 'not sended') 
      or ($isOpenBookAfterSeptemberSending and $currentSanBook['type'] == 'after september')
      ) 
      and $currentSanBook 
      and $docType == 2 
      and $buttonType == "send") {
    changeBook($bookingModel, $currentSanBook["id"]);
    changeNotSended($currentSanBook["id"]);
    return [$currentSanBook["id"]];
  }

  // Заявка не отправлена, документ Отправить заявку, кнопка отправить/автоотправка, но это исключение с октября 23 года
  if($isOpenBookAfterSeptember and !$currentSanBook and $docType == 2 and in_array($buttonType, ['send', 'autosend'])) {
    return [createBookNotSend($data['card_id'], $data['sanid'], $bookingModel, 'after september')];
  }

  if(($status_id == 142 or $status_id == 26726761) and $currentSanBook) {
    return [$currentSanBook["id"]];
  }

  // Заявка отправлена и кнопка отправки/просмотра заявки?
  if($currentSanBook and $docType == 2 and ($buttonType == "send" or $buttonType == "see")) {
    printError('Заявка в санаторий уже отправлена. Отправьте изменение, корректировку или аннуляцию.');
    exit;
  }

  // Заявка отправлена и она соответствует текущей сделке?
  if($currentSanBook and $isSame) {
    return [$currentSanBook["id"]];
  }

  // Автоматическая отправка заявки?
  if($docType == 2 and $buttonType == "autosend") {
    return [createBook($data['card_id'], $data['sanid'], $bookingModel)];
  }

  // Заявка отправлена, но санаторий не торт?
  if($books and !$currentSanBook) {
    printError('Аннулируйте заявку в предыдущий санаторий!');
    exit;
  }

  // Заявка отправлена, она не соответствует текущей сделке и тип документа корректировка+уточнение?
  if($currentSanBook and !$isSame and ($docType == 9 or $docType == 0)) {
    if($buttonType != "see") changeBook($bookingModel, $currentSanBook["id"]);
    return [$currentSanBook["id"], $notSameDetails];
  }
  
  if($currentSanBook and !$isSame and $currentSanBook['payload'] == "") {
    changeBook($bookingModel, $currentSanBook["id"]);
    return [$currentSanBook["id"]];    
  }

  // Заявка отправлена, она не соответствует текущей сделке и тип документа не корректировка+уточнение?
  if($currentSanBook and !$isSame and !$data['kvota']) {
    printError('Есть изменения в сделке. Отправьте корректировку, пожалуйста.', $notSameDetails);
    exit;
  }

  // Заявка не отправлена, документ Отправить заявку, Кнопка отправить, но даты попадают в исключение
  if($notSend and !$currentSanBook and $docType == 2 and $buttonType == "send") {
    return [createBookNotSend($data['card_id'], $data['sanid'], $bookingModel)];
  }

  // Заявка не отправлена, документ Отправить заявку, Кнопка отправить или автоотправка заявки?
  if(!$currentSanBook and $docType == 2 and ($buttonType == "send" or $buttonType == "autosend")) {
    return [createBook($data['card_id'], $data['sanid'], $bookingModel)];
  }

  // Заявка не отправлена и тип документа договор?
  if(!$currentSanBook and ($docType == 1 or $docType == 6) and !$data['kvota'] and !in_array($manager, [12335137, 3449320, 3449308, 7100445, 3449311])) {
    printError('Нет активных броней по этой сделке. Отправьте заявку на бронирование в санаторий и после этого сгенерируйте договор!');
    exit;
  }

  // Заявка не отправлена, Тип документа Аннуляция?
  if(!$currentSanBook and $docType == 4) {
    printError('Нет активных заявок по сделке');
    exit;
  }

  // Заявка не отправлена, Тип документа Корректировка или уточнение?
  if(!$currentSanBook and ($docType == 9 or $docType == 0)) {
    printError('Прежде чем отправлять корректировку или уточнение, нужно отправить заявку.');
    exit;
  }
  return ['Б/Н'];
}

function matchCurrentAndExistForBook($current, $exist) {
  if($current == '""' or $exist == '""') return [false];
  if($current == '' or $exist == '') return [false];

  $current = json_decode($current, true);
  $exist = json_decode($exist, true);

  if(count($current) == 0) return [false];
  if(count($exist) == 0) return [false];

  $leadRules = ["san_id", 
                "Дата заезда", 
                "Дата выезда", 
                "Количество дней", 
                "Категория номера", 
                "Количество номеров", 
                "Туроператор"];

  $guestsRules = ["type_appart" => "Тип номера", 
                  "kind_appart" => "Вид размещения", 
                  "feeding" => "Питание", 
                  "type_health" => "Лечение", 
                  "banket" => "Банкет", 
                  "guestcheckin" => "Дата заезда гостя", 
                  "guestcheckout" => "Дата выезда гостя", 
                  "child_banket" => "Детский утренник"];

  $return = [true, []];


  foreach($current as $key => $value) {

    if(in_array($key, $leadRules)) {
      if($current[$key] != $exist[$key]) {
        $return[0] = false;
        array_push($return[1], ["name" => $key, "type" => "Сделка", "exist" => $exist[$key], "current" => $current[$key], "nameFieldForPrint" => $key]);

      }
    }

    if($key == "Гости") {
      if(count($current[$key]) != count($exist[$key])) {
        $return[0] = false;
        array_push($return[1], ["name" => "Количество гостей", 
                                "type" => "Сделка", 
                                "exist" => countGuests($exist[$key]), 
                                "current" => countGuests($current[$key]), 
                                "nameFieldForPrint" => "Количество гостей"]);
        return $return;
      }
      foreach($current[$key] as $guestKey => $guestValue) {
        foreach($guestValue as $k => $v) {
          if(array_key_exists($k, $guestsRules)) {
            if($current[$key][$guestKey][$k] != $exist[$key][$guestKey][$k]) {
              $return[0] = false;
              array_push($return[1], ["name" => $guestsRules[$k], "type" => "Гость: ".$exist[$key][$guestKey]['just_fio'], "exist" => $exist[$key][$guestKey][$k], "current" => $current[$key][$guestKey][$k], "nameFieldForPrint" => $guestsRules[$k]." (".$exist[$key][$guestKey]['just_fio'].")"]);

            }
          }
        }
      }
    }
  }
  return $return;
}

function countGuests($guests) {
  $kolichestvo_turistov = 0;

  foreach($guests as $guest) {
    $filteredGoingGuestByNameAndCheckInOut = array_filter($guests, function($el) use ($guest) {
      return mb_strtolower(trim($el["just_fio"])) === mb_strtolower(trim($guest["just_fio"])) and $el["guestcheckout"] == $guest["guestcheckin"]; 
    });
    if(count($filteredGoingGuestByNameAndCheckInOut) == 0) {
      $kolichestvo_turistov++;
    }
  }

  return ($kolichestvo_turistov != 0) ? $kolichestvo_turistov : count($guests);
}

?>
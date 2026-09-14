<?php

function getPdfUrl($filePath) {
  $domain = 'https://wg.belkurort.by/widget/docjetV2/';

  $mainError = '';
  $newFilePath = myOwnPdfConverter($filePath, $domain, $mainError);
  if(!!$newFilePath) return $newFilePath;
  writeError($mainError);

  $iLoveError = '';
  $newFilePath = iLovePdfConverter($filePath, $domain, $iLoveError);
  if(!!$newFilePath) return $newFilePath;

  $oldError = '';
  $newFilePath = oldPdfConverter($filePath, $oldError);
  if(!!$newFilePath) return $newFilePath;

  // Сюда попадаем, только если не сработал ни один конвертер. Раньше в этом месте
  // возвращался false, вызывающий код подставлял его в header('Location: ') или в
  // file_get_contents() — пользователь получал пустую страницу, а на почту уходил
  // пустой pdf. Дальше идти нельзя, показываем ошибку.
  failPdfConversion($filePath, $mainError, $iLoveError, $oldError);
}

function failPdfConversion($filePath, $mainError = '', $iLoveError = '', $oldError = '') {
  writeLogLine('Не сработал ни один конвертер, pdf не сформирован | файл: '.$filePath.
               ' | основной: '.($mainError !== '' ? $mainError : 'нет данных').
               ' | iLovePDF: '.($iLoveError !== '' ? $iLoveError : 'нет данных').
               ' | старый: '.($oldError !== '' ? $oldError : 'нет данных'));
  require_once __DIR__.'/src/error.php';
  printError('Не удалось сконвертировать документ в PDF: сервис конвертации недоступен. '.
             'Попробуйте ещё раз через минуту или выгрузите документ в .docx.');
  exit;
}

function writeError($reason = '') {
  $line = 'Документ был сгенерирован через доп конвертер';
  if($reason !== '') $line .= ' | '.$reason;
  writeLogLine($line);
}

function writeLogLine($line) {
  $fp = fopen('errorLogging.txt', 'a');
  if(!$fp) return;
  fwrite($fp, date("m.d.y H:i:s").' - '.$line . PHP_EOL);
  fclose($fp);
}

function buildPdfUrl($domain, $path) {
  // В имени файла есть пробелы, двоеточия и кириллица. И в заголовке Location,
  // и в запросе к Яндекс.Диску адрес должен быть закодирован посегментно,
  // иначе наружу уходят сырые UTF-8 байты
  $parts = explode('/', $path);
  foreach ($parts as $i => $part) {
    $parts[$i] = rawurlencode($part);
  }
  return $domain.implode('/', $parts);
}

function shortenForLog($text, $length = 300) {
  return str_replace(array("\r", "\n"), ' ', substr((string)$text, 0, $length));
}

function myOwnPdfConverter($filePath, $domain, &$error = null) {
  $ch = null;
  $httpCode = 0;
  $contentType = '';
  try {
    $fileInfo = pathinfo($filePath);
    $convertToExt = 'pdf';
    $newPath = 'wievDoc/'.$fileInfo['filename'].'.'.$convertToExt;
  
    $data = (object)array("data" => (object)array(),
                          "options" => (object)array("cacheReport" => false, 
                                                      "convertTo" => $convertToExt, 
                                                      "overwrite" => true, 
                                                      "reportName" => strGen()),
                          "template" => (object)array("content" => base64_encode(file_get_contents($filePath)),
                                                      "encodingType" => 'base64',
                                                      "fileType" => $fileInfo['extension']));
  
    $ch = curl_init('https://dg.zdravkurort.by/api/v2/template/render');
    $payload = json_encode($data);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json', 'Authorization: Bearer P2diCpAYQ3zxKaBW2IhuVSvs']);
    // //curl_setopt($ch, CURLOPT_HEADER, true); 
    // # Return response instead of printing.
    // Без таймаутов зависший конвертер убивает скрипт по max_execution_time,
    // и тогда в лог не попадает ничего: до записи причины дело не доходит.
    // Обычный ответ укладывается в 3-4 с, так что запас здесь большой
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
  
    if(!curl_errno($ch)) {
      // Поведение не меняем, но помечаем в логе ответ, который не похож на pdf:
      // такой ответ запишется в файл .pdf и откроется у пользователя битым
      if($httpCode != 200 || stripos($contentType, 'pdf') === false) {
        writeLogLine('Основной конвертер ответил не pdf | HTTP '.$httpCode.
                     ' | Content-Type: '.$contentType.
                     ' | файл: '.$filePath.
                     ' | ответ: '.shortenForLog($result));
      }
      $fh = fopen($newPath, 'w');
      fwrite($fh, $result);
      fclose($fh);
      return buildPdfUrl($domain, $newPath);
    } else {
      throw new Exception('curl #'.curl_errno($ch).': '.curl_error($ch));
    }
  } catch(Exception $e) {
    $error = 'основной конвертер упал: '.$e->getMessage().' | HTTP '.$httpCode.' | файл: '.$filePath;
    return false;
  } finally {
    if(is_resource($ch)) curl_close($ch);
  }
}

function oldPdfConverter($filePath, &$error = null) {
  $fileinfo = pathinfo($filePath);
	$path = $fileinfo['dirname'];
	$filename = $fileinfo['filename'];
	$cfile = curl_file_create($filePath);
	$url = "http://194.67.91.207:83/supersecretlogic.php";
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_URL, $url);
	// Хост принимает соединение, но не отвечает, поэтому одного CONNECTTIMEOUT мало:
	// без CURLOPT_TIMEOUT запрос висит до max_execution_time, и всё это время
	// пользователь смотрит в пустую страницу
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
	curl_setopt($ch, CURLOPT_TIMEOUT, 15);

	//Create a POST array with the file in it
	$postData = array(
		'file' => $cfile,
		'atata' => '2131236127369172831432524368'
	);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

	// Execute the request
	$response = curl_exec($ch);
	if(curl_errno($ch)) {
		$error = 'старый конвертер упал: curl #'.curl_errno($ch).': '.curl_error($ch);
		curl_close($ch);
		return false;
	}
	curl_close($ch);
	$rawResponse = $response;
	$response = json_decode($response,true);
  if(!!$response and !$response["error"] and !!$response["pdf_link"]) {
    return $response["pdf_link"];
  } else {
    $error = 'старый конвертер вернул не ссылку: '.shortenForLog($rawResponse);
    return false;
  }
}

function iLovePdfConverter($filePath, $domain, &$error = null) {
  try {
    $fileInfo = pathinfo($filePath);
    $newPath = 'wievDoc/'.$fileInfo['filename'].'.pdf';
    require_once 'ilovepdf/init.php';
    if(rand(1,2) == 1) {
      $ilovepdf = new Ilovepdf\Ilovepdf('project_public_49e6b7c8e53ef8884b9e72bef42f2179_u5iL104a5d099045bd2e9c624ba89a2674068','secret_key_c60779739c2de8799eaea8ad848e36ce_4M_LYfbd53a674f76b806e05f7219305a19dc');
    } else {
      $ilovepdf = new Ilovepdf\Ilovepdf('project_public_0dc74e037e4a92250bdef7ba9b17e5b0_Isjsm3bea716e1223fca7a5daf1a65890d856','secret_key_910e4f071b8616f5d9d402dbd3d8f4a7_lQTlma6bdda657debf4d372831ce97db7876e');
    }
    $myTaskConvertOffice = $ilovepdf->newTask('officepdf');
    $file1 = $myTaskConvertOffice->addFile($filePath);
    $myTaskConvertOffice->execute();
    $myTaskConvertOffice->download('wievDoc/');
    return buildPdfUrl($domain, $newPath);
  } catch(Exception $e) {
    $error = 'iLovePDF упал: '.$e->getMessage().' | код: '.$e->getCode();
    return false;
  }
}

function strGen($length = 16) {
  $permitted_chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  return substr(str_shuffle($permitted_chars), 0, $length);
}

function getPdfUrl2($file) {
	$fileinfo = pathinfo($file);
	$path = $fileinfo['dirname'];
	$filename = $fileinfo['filename'];
	$cfile = curl_file_create($file);
	$url = "http://194.67.91.207:83/supersecretlogic.php";
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_URL, $url);

	//Create a POST array with the file in it
	$postData = array(
		'file' => $cfile,
		'atata' => '2131236127369172831432524368'
	);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

	// Execute the request
	$response = curl_exec($ch);
	$response = json_decode($response,true);
	if($response == 1) {
		require_once 'ilovepdf/init.php';
		$ilovepdf = (rand(1,2) == 1) ? new Ilovepdf\Ilovepdf('project_public_49e6b7c8e53ef8884b9e72bef42f2179_u5iL104a5d099045bd2e9c624ba89a2674068','secret_key_c60779739c2de8799eaea8ad848e36ce_4M_LYfbd53a674f76b806e05f7219305a19dc') : new Ilovepdf\Ilovepdf('project_public_0dc74e037e4a92250bdef7ba9b17e5b0_Isjsm3bea716e1223fca7a5daf1a65890d856','secret_key_910e4f071b8616f5d9d402dbd3d8f4a7_lQTlma6bdda657debf4d372831ce97db7876e');
		$myTaskConvertOffice = $ilovepdf->newTask('officepdf');
		$file1 = $myTaskConvertOffice->addFile($file);
		$myTaskConvertOffice->execute();
		$myTaskConvertOffice->download($path);
		return ("https://wg.belkurort.by/widget/docjetV2/".$path."/".rawurlencode($filename).".pdf");
	} else {
		return ($response["pdf_link"]);
	}
}

?>
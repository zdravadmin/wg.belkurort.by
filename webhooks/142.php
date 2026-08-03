<?php 
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL); //показываем все ошибки

set_time_limit(100);

$lockfile = fopen("142.lock", 'w');
if(flock($lockfile, LOCK_EX | LOCK_NB ) !== true)
  die("");

//подключаем amo
require_once(__DIR__ . '/../auth.php');

require_once(__DIR__ . '/../functions.php');

require_once(__DIR__ . '/../db_login.php');


$tsf = __DIR__ . '/tsFor142.txt';
$ts = file_get_contents($tsf);

// Подготавливаем файл очереди клиентских менеджеров
$CLIENTICS_MANAGERS = [3449311, 7100445, 7974150];
// $CLIENTICS_MANAGERS = [7100445, 7974150];
$turnFile = 'clients.managers.queue.txt';
$leadDistributionQueue = file_get_contents($turnFile);
$leadDistributionQueue = json_decode($leadDistributionQueue, true);
if(!$leadDistributionQueue or !isToday($leadDistributionQueue[current_date])) {
	$leadDistributionQueue = generateManagersObject($CLIENTICS_MANAGERS);
}

// $notes = [];
// $limit = 0;
// 	do {
// 		$newArr = $amo->note->apiList(['type' => 'lead',
// 										'limit_rows' => 500,
// 										'limit_offset' => $limit,
// 										'note_type' => 3], 
// 										date("Y-m-d H:i:s",$ts));
// 		$notes = array_merge($notes, $newArr);
// 		$limit += 500;
// 		sleep(0.2);
// 	} while (count($newArr) == 500);
	
// $successLeadId = [];
// foreach($notes as $note => $val) {
	
// 	$notes[$note]['text'] = json_decode($notes[$note]['text'],true);
// 	if($notes[$note]['text']["STATUS_NEW"] == "142" && $notes[$note]["date_create"] == $notes[$note]["last_modified"]) {
// 		array_push($successLeadId, (object) array('id' => $notes[$note]["element_id"], 'last_modified' => $notes[$note]["last_modified"]));
// 	}
// 	// if($ts < $notes[$note]["last_modified"]) {
// 	// 	$ts = $notes[$note]["last_modified"];
// 	// }
// }

$notes = getNotesWith142StatusChange($ts);
if(count($notes) < 1) exit;
//получаем все в статусе 'Успешно реализована'
$successLeadId = getSuccessLeadIdsFromNotes($notes);
usort($successLeadId, function($a, $b) {return strcmp($a->last_modified, $b->last_modified);});
// $successLeadId = array_slice($successLeadId, 0 , 1);

	if(count($successLeadId) > 0) {
			foreach($successLeadId as $lid) {
				$q = $lid->id;
				$lead = $amo->lead;
				$larr = [];

				//Получаем лид
				$leads = getRequestToAmo('/api/v2/leads/?id='.$q);

				$l = $leads[0];
				$rr = findcustomfieldval($l,371365);
				sleep(0.2);

				$tasks = [];

				if($l['pipeline']['id'] == 1736272) {
					
					//если есть контакты
					if(count($l["contacts"]["id"]) > 0) {
						//Получаем все контакты по лиду
						$contacts = getRequestToAmo('/api/v2/contacts/?id='.implode(',',$l["contacts"]["id"]));
						sleep(0.5);
						
						//Записываем все лиды по контактам
						foreach($contacts as $c) {
							$larr = array_merge($larr, $c["leads"]["id"]);
						}
					}

					if(isset($l["company"]["id"])) {
						//Записываем все лиды по компаниям
						$compLeads = getRequestToAmo('/api/v2/companies/?id='.$l["company"]["id"]);
						
						$larr = array_merge($larr, $compLeads[0]["leads"]["id"]);
					}
					
					//Получаем все лиды
					if(count($larr) > 0) {
						$larr = array_unique($larr);
						$allLeads = getRequestToAmo('/api/v2/leads/?id='.implode(',',$larr));
						sleep(0.3);
						usort($allLeads,"cmp");//сортируем их по дате создания
						//и смотрим есть ли клиентский манагер
						foreach($allLeads as $le) {
							if(findcustomfieldval($le,371365) != NULL) {
								$rr = findcustomfieldval($le,371365);
							}
						}
					}
					
					if(!in_array((int)$rr, $CLIENTICS_MANAGERS)) {
						$rr = getManagerWithMinimalCountLead($leadDistributionQueue['managers']); // Берём клиентского с минимальным количеством сделок за сегодня
					}

					$leadDistributionQueue['managers'][$rr] += 1; // Добавляем клиентскому 1 сделку

					//Если есть клиентский манагер, то оставляем его, если нет, то назначаем нового по очереди
					// $CLIENTICS_MANAGERS = [3449311, 7100445, 7974150];
					// if(!in_array((int)$rr, $CLIENTICS_MANAGERS)) {
					// 	if($raspred == 0) {
					// 		$rr = 3449311; 
					// 		$raspred = 1;
					// 	} else if($raspred == 1) {
					// 		$rr = 7100445;
					// 		$raspred = 2;
					// 	} else {
					// 		$rr = 7974150;
					// 		$raspred = 0;
					// 	}
					// }

					//заносим ответственного в сделку
					sendRequestToAmo("PATCH", "/api/v4/leads", (object)[(object)["id" => (int)$l['id'], 
																				"custom_fields_values" => [
																					(object)["field_id" => 371365, "values" => [(object)["value" => $rr]]]
																				]
																				]]);
					// $lead->addCustomField(371365, $rr);
					// $lead->apiUpdate((int)$l['id'], 'now');
					sleep(0.2);
					
					//ставим задачу на перезвон через неделю после выезда
						$dateOut = findcustomfieldval($l,305205);
						$dateIn = findcustomfieldval($l,305203);
						if($dateOut != "") {
							array_push($tasks, (object)["responsible_user_id" => (int) $rr,
														"entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1495072,
														"text" => "Обратная связь",
														"complete_till" => (int) date('U', strtotime($dateOut.'+7 DAY'))
													]);
						}
						if($dateIn != "") {
							//Ставим задачу на Бухгалтера, чтобы распечатала договор
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1519030,
														"text" => "Распечатать договор и счёт",
														"responsible_user_id" => 3449320,
														"complete_till" => (int) date('U', strtotime($dateIn)) 
													]);
						}
						if($dateIn != "") {
								//просчитываем дату задачи 
								$dateTask = strtotime($dateIn)-60*60*24*3;
								if(date('N', $dateTask) == 7) {
									$dateTask = $dateTask - 60*60*24*2;
								} else if(date('N', $dateTask) == 6) {
									$dateTask = $dateTask - 60*60*24*2;
								}
								$dateTask = date('Y-m-d H:i:s', $dateTask);
												//за 3 дня до заезда созвониться с клиентом
												array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1,
														"text" => "Звонок перед заездом",
														"responsible_user_id" => (int) $rr,
														"complete_till" => (int) date('U', strtotime($dateTask))
													]);
						}
						
					//Оплата получена. Подтверждение + путёвка.
												array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1469248,
														"text" => "Оплата получена. Подтверждение + путёвка",
														"responsible_user_id" => 3504832,
														"complete_till" => time()]);	

					//Взять счёт от санатория
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1495081,
														"text" => "Взять счёт от санатория",
														"responsible_user_id" => 3504832,
														"complete_till" => time()]);		

					//Оплата получена
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1457761,
														"text" => "Оплата получена",
														"responsible_user_id" => $l['responsible_user_id'],
														"complete_till" => time()]);	

					//Трансфер оплачен по безналу. Взять данные по трансферу.
						if(findcustomfieldval($l,305137) > 0) {
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1495075,
														"text" => "Трансфер оплачен по безналу. Взять данные по трансферу.",
														"responsible_user_id" => 3504832,
														"complete_till" => time()]);		
			
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1495075,
														"text" => "Трансфер оплачен по безналу. Взять данные по трансферу.",
														"responsible_user_id" => (int) $rr,
														"complete_till" => time()]);
						}
						
					//Меняем ответственность по контакту	
							sleep(0.2);
								$connections = $amo->links->apiList([
									'from' => 'leads',
									'from_id' => $l['id'],
									'to' => 'contacts'
								]);

								if(count($connections) != 0) {
									sleep(0.3);
									try {
										sendRequestToAmo("PATCH", "/api/v4/contacts", (object)array_map(function($conn)  use ($rr) {
											return [
												"id" => $conn["to_id"],
												"responsible_user_id" => (int) $rr,
											];
										},
										$connections));
									} catch (Exception $e) {
										if($e->getCode() != 400) {
											exit;
										}
									}
								}
						//проверяем, есть ли бронирование
						$stmt = $db->query('SELECT * FROM `books` where `lead_id` = '.(int)$q.' and `cancellation` = 0');
						$checkbooks = $stmt->fetchAll();
						
						// if(findcustomfieldval($l,351975) != NULL and findcustomfieldval($l,305089) != 452097 and findcustomfieldval($l,305089) != 450649) { //Если бронирование из нашей квоты - то,							
						// 	//Ставим задачу на Лизу, чтобы внесла бронирование как оплачено
						// 	sleep(0.2);
						// 	$task = $amo->task;
						// 	$task['element_id'] = $l['id'];
						// 	$task['element_type'] = 2;
						// 	$task['task_type'] = 1;
						// 	$task['text'] = "Отметь в таблице бронирования квоту как оплаченную";
						// 	$task['responsible_user_id'] = 3504832;
						// 	$task['complete_till'] = 'NOW';
						// 	$id = $task->apiAdd();
						// }

						//проверяем нужен ли акт
						$stmt = $db->query('SELECT * FROM `companies_to_leads` where `lead_id` = '.(int)$q);
						$companies = $stmt->fetchAll();
						if(count($companies)) {
									//Ставим задачу на Бухгалтера, чтобы составил акт по выезду клиента из санатория
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1,
														"text" => "Сделать акт выполненных работ",
														"responsible_user_id" => 3449320,
														"complete_till" => (int) date('U', strtotime($dateOut)) 
														]);				
									//Ставим задачу на Бухгалтера, чтобы составил ЭСЧФ по дате заезда в саник
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 2776517,
														"text" => "Выставить ЭСЧФ на портал",
														"responsible_user_id" => 3449320,
														"complete_till" => (int) date('U', strtotime($dateIn))
														]);		
						}

						// если Приозёрный, то ставим задачу на сбор доп инфы
						if(findcustomfieldval($l,305089) == 486053) {
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1,
														"text" => "Отправить доп информацию о паспортах гостей",
														"responsible_user_id" => (int) $rr,
														"complete_till" => time()
														]);				
						}
							
						//отправляем заявку на бронирование	
						// if(findcustomfieldval($l,378299) != 1) { // поле аннуляции
							/*if(count($checkbooks) == 0 and // в БД нет активных заявок
									findcustomfieldval($l,370933) == NULL and // поле суммы возврата
									// findcustomfieldval($l,305351) == NULL and // поле ссылки на заявку
									$l['id'] != 20474264) { // Если заявок не отправляли, то отправляем
								  //(strtotime($dateIn) - 20*24*60*60) < time() or //Если до заезда менее 20 дней
								// if(in_array(findcustomfieldval($l,305089), array(2704981, 458451, 486053, 473417))) { // если санаторий один из...
									sleep(0.2);
									//отправляем заявку на бронирование в санаторий
									$myCurl = curl_init();
									curl_setopt_array ($myCurl, array(
										CURLOPT_URL => 'http://wg.belkurort.by/widget/docjetV2/AMO_Script.php?card_id='.$q.'&card_type=lead&doc=dog212&userid='.$l["responsible_user_id"].'&docType=2&buttonType=autosend',
										CURLOPT_RETURNTRANSFER => true,
										CURLOPT_POST => true)
									);
									$response = curl_exec($myCurl);
									curl_close($myCurl);
								// }
							}*/
						// }

						// Ставим задачу на реанимацию в будущем
							array_push($tasks, (object)["entity_id" => (int)$l['id'],
														"entity_type" => "leads",
														"task_type_id" => 1,
														"text" => "Уточнить актуальность повторного отдыха в санатории",
														"responsible_user_id" => $l['responsible_user_id'],
														"complete_till" => (int) date('U', strtotime($dateOut.'+180 DAY'))
							]);	

						//отправляем задачи
						sendRequestToAmo("POST", "/api/v4/tasks", $tasks);
					}
					$ts = ($lid->last_modified > $ts) ? $lid->last_modified + 1 : $ts;
					file_put_contents($tsf, $ts);
					file_put_contents($turnFile, json_encode($leadDistributionQueue));
			}
			// $ts = $ts + 1;
	}
	// file_put_contents($tsf, $ts);
	// file_put_contents('turn.txt', $raspred);
	// file_put_contents($turnFile, json_encode($leadDistributionQueue));

function getManagerWithMinimalCountLead($managers) {
	$minimum = min($managers);
	foreach($managers as $managerId => $counter) {
		if($counter == $minimum) {
			return $managerId;
		}
	}
}

function isToday($timestamp) {
	return date('d.m.Y') === date('d.m.Y', $timestamp);
}

function generateManagersObject($CLIENTICS_MANAGERS) {
	$obj = ["current_date" => time()];
	$managersArr = [];
	foreach($CLIENTICS_MANAGERS as $man) {
		$managersArr[$man] = 0;
	}
	$obj["managers"] = $managersArr;
	return $obj;
}

function cmp($a, $b) 
{
    return ($a["created_at"] > $b["created_at"]);
}

function getNotesWith142StatusChange($ts) {
	$page = 1;
	$result = [];
	$newArr = [];
	
	do {
		$newArr = sendRequestToAmo('GET','/api/v4/events?filter[type]=lead_status_changed&filter[value_after][leads_statuses][0][pipeline_id]=1736272&filter[value_after][leads_statuses][0][status_id]=142&filter[created_at][from]='.$ts.'&page='.$page.'&limit=250');
		if(isset($newArr["_embedded"]["events"]) && count($newArr["_embedded"]["events"])) {
			$result = array_merge($result, $newArr["_embedded"]["events"]);
		}
	} while (isset($newArr["_links"]["next"]["href"]));

	return $result;
}

function getSuccessLeadIdsFromNotes($notes) {
	$result = [];
	foreach($notes as $index => $note) {
		if(	$note["value_after"][0]["lead_status"]["id"] == 142 && 
				$note["value_after"][0]["lead_status"]["pipeline_id"] == 1736272 &&
				$note["type"] == "lead_status_changed" &&
				$note["entity_type"] == "lead") {
			array_push($result, (object) array('id' => $note["entity_id"], 'last_modified' => $note["created_at"]));
		}
	}
	return $result;
}

?>
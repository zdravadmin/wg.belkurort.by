<?php 
function vardump($var) {
  echo '<pre>';
  var_dump($var);
  echo '</pre>';
}

function findcustomfieldval($leadarray, $customfieldid ) {
	for($i=0;$i<count($leadarray["custom_fields"]);$i++) {
		if($leadarray["custom_fields"][$i]['id'] == $customfieldid) {
			$array = array();
			for($j=0;$j<count($leadarray["custom_fields"][$i]["values"]);$j++) {
				array_push($array, $leadarray["custom_fields"][$i]["values"][$j]['value']);	
			}
			return implode(",",$array);
		}
	}
}

function findcustomfieldvalEnum($leadarray, $customfieldid) {
	for($i=0;$i<count($leadarray["custom_fields"]);$i++) {
		if($leadarray["custom_fields"][$i]['id'] == $customfieldid) {
			$array = array();
			for($j=0;$j<count($leadarray["custom_fields"][$i]["values"]);$j++) {
				array_push($array, $leadarray["custom_fields"][$i]["values"][$j]['enum']);	
			}
			return implode(",",$array);
		}
	}
}

function searchuserbyid ($id) {
	if($id==0 or $id == null) {
		return "";
	} else {
	global $usersAmo;
	for ($x=0;$x <= count($usersAmo);$x++) {
			if($usersAmo[$x]["user_id"] == $id) {
				return $usersAmo[$x]['user_name'];
			}
		}
	}
}

function create_note($lead_id, $text, $created_user_id = 0)
	{
		global $amo;
		$note = $amo->note;
		$note['element_id'] = $lead_id;
		$note['created_user_id'] = $created_user_id;
		$note['element_type'] = \AmoCRM\Models\Note::TYPE_LEAD;
	    $note['note_type'] = \AmoCRM\Models\Note::COMMON; // @see https://developers.amocrm.ru/rest_api/notes_type.php
	    $note['text'] = $text;
	    $id = $note->apiAdd();
	}

function create_task($lead_id, $text, $responsible_user_id = 0)
	{
		global $amo;
    $task = $amo->task;
    $task['element_id'] = $lead_id;
    $task['element_type'] = 1;
    $task['date_create'] = 'NOW';
    $task['task_type'] = 1;
    $task['text'] = $text;
    $task['responsible_user_id'] = $responsible_user_id;
    $task['complete_till'] = '+1 DAY';

    $id = $task->apiAdd();
	}
	/*
function getCurrency($num) {
		global $date_start;
		global $datenow;
		
		$myURL = 'https://www.nbrb.by/API/ExRates/Rates/Dynamics/'.$num.'?'; 
		$options = array("startDate" => $date_start,"endDate" => $datenow); 
		$myURL .= http_build_query($options,'','&'); 
		
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $myURL);
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
		$out = curl_exec($curl);
		curl_close($curl);
		
		return $out; 
}*/

function getCurrency($num) {
	global $db;
	if(!isset($db)) {require_once $_SERVER['DOCUMENT_ROOT']."/db_login.php";}
	$num = (string)$num;
	global $date_start;
	global $datenow;
	$resultArray = [];
	$d = date('Y-m-d', strtotime($datenow. ' +1 DAY'));
	
	$stmt = $db->query("SELECT DATE_FORMAT(`created_at`,'%d.%m.%Y') as date, `updated_at` as 'MAX(`updated_at`)', `data` 
											FROM `currency_quotes` 
											INNER JOIN (SELECT DATE_FORMAT(`created_at`,'%d.%m.%Y') as cr_at, MAX(`updated_at`) as up_at 
																	FROM `currency_quotes` 
																	GROUP BY cr_at) subtable 
											ON DATE_FORMAT(`currency_quotes`.`created_at`,'%d.%m.%Y') = `subtable`.`cr_at` 
													AND `currency_quotes`.`updated_at` = `subtable`.`up_at` 
											WHERE `created_at` >= STR_TO_DATE('".$date_start."', '%Y-%m-%d') AND `created_at` <= STR_TO_DATE('".$d."', '%Y-%m-%d')");

	$coursesFromDB = $stmt->fetchAll();
	if(count($coursesFromDB)>0) {
		foreach($coursesFromDB as $date) {
			$datas = json_decode($date['data'], true);
			if($datas) {
				foreach($datas as $data) {
					if($data["Cur_ID"] == $num) {
						array_push($resultArray, (object)["Cur_ID" => $data["Cur_ID"], "Date" => $data["Date"], "Cur_OfficialRate" => $data["Cur_OfficialRate"]]);
					}
				}
			}
		}
	}
	return json_encode($resultArray);
}

function getCurrencyByCode($code) {
	global $db;
	if(!isset($db)) {require_once $_SERVER['DOCUMENT_ROOT']."/db_login.php";}
	$code = (string)$code;
	global $date_start;
	global $datenow;
	$resultArray = [];
	$d = date('Y-m-d', strtotime($datenow. ' +1 DAY'));
	
	$stmt = $db->query("SELECT DATE_FORMAT(`created_at`,'%d.%m.%Y') as date, `updated_at` as 'MAX(`updated_at`)', `data` 
											FROM `currency_quotes` 
											INNER JOIN (SELECT DATE_FORMAT(`created_at`,'%d.%m.%Y') as cr_at, MAX(`updated_at`) as up_at 
																	FROM `currency_quotes` 
																	GROUP BY cr_at) subtable 
											ON DATE_FORMAT(`currency_quotes`.`created_at`,'%d.%m.%Y') = `subtable`.`cr_at` 
													AND `currency_quotes`.`updated_at` = `subtable`.`up_at` 
											WHERE `created_at` >= STR_TO_DATE('".$date_start."', '%Y-%m-%d') AND `created_at` <= STR_TO_DATE('".$d."', '%Y-%m-%d')");

	$coursesFromDB = $stmt->fetchAll();
	if(count($coursesFromDB)>0) {
		foreach($coursesFromDB as $date) {
			$datas = json_decode($date['data'], true);
			if($datas) {
				foreach($datas as $data) {
					if($data["Cur_Abbreviation"] == $code) {
						array_push($resultArray, (object)["Cur_ID" => $data["Cur_ID"], "Date" => $data["Date"], "Cur_OfficialRate" => $data["Cur_OfficialRate"], "Cur_Scale" => $data["Cur_Scale"]]);
					}
				}
			}
		}
	}
	return json_encode($resultArray);
}
	
function deleteLeads($leadsIds) {
	$amocrm = new amocrm(LOGIN, PASSWORD, DOMAIN);
	$request = $amocrm->DeleteLeads($leadsIds);
	return $request;
}
	
function getRequestToAmo($link, $data = []) {
	global $subdomain;
	global $access_token;

	$link = "https://".$subdomain.$link; //Формируем URL для запроса

	/** Формируем заголовки */
	$headers = [
		'Authorization: Bearer ' . $access_token
	];

	$curl = curl_init(); //Сохраняем дескриптор сеанса cURL
	/** Устанавливаем необходимые опции для сеанса cURL  */
	curl_setopt($curl,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl,CURLOPT_USERAGENT,'amoCRM-oAuth-client/1.0');

	// curl_setopt($curl, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5);
	// curl_setopt($curl, CURLOPT_PROXY, '45.128.205.169:1080');
	// curl_setopt($curl, CURLOPT_PROXYUSERPWD, 'zdravkurort:ZLWzeghShcWr');
	curl_setopt($curl, CURLOPT_TIMEOUT, 5);

	curl_setopt($curl,CURLOPT_URL, $link);
	curl_setopt($curl,CURLOPT_HTTPHEADER, $headers);
	curl_setopt($curl,CURLOPT_HEADER, false);
	curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, 1);
	curl_setopt($curl,CURLOPT_SSL_VERIFYHOST, 2);
	if(count($data) != 0) {
		curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
	};
	$out = curl_exec($curl); //Инициируем запрос к API и сохраняем ответ в переменную
	$code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	curl_close($curl);

	$result = json_decode($out,TRUE);
	sleep(0.5);

	return ($result["_embedded"]["items"] != null) ? $result["_embedded"]["items"] : array();
}

function sendRequestToAmo($type, $url, $data = []) {
	global $subdomain;
	global $access_token;
	$link = 'https://' . $subdomain . $url; //Формируем URL для запроса
	/** Формируем заголовки */
	$headers = ['Authorization: Bearer ' . $access_token];
	/**
	 * Нам необходимо инициировать запрос к серверу.
	 * Воспользуемся библиотекой cURL (поставляется в составе PHP).
	 * Вы также можете использовать и кроссплатформенную программу cURL, если вы не программируете на PHP.
	 */
	$curl = curl_init(); //Сохраняем дескриптор сеанса cURL
	/** Устанавливаем необходимые опции для сеанса cURL  */
	if($type == "POST") {
		curl_setopt($curl, CURLOPT_POST, 1);
		// array_push($headers, "Content-Type: application/json");
		// curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
		if(gettype($data) === "string") {
			array_push($headers, "Accept: application/json, text/javascript, */*; q=0.01");
			array_push($headers, "Content-Type: application/x-www-form-urlencoded; charset=UTF-8");
			array_push($headers, "X-Requested-With: XMLHttpRequest");
			curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
		} else {
			array_push($headers, "Content-Type: application/json");
			curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
		}
	} else if($type == "GET") {
		if(count($data) > 0) {
			$link = $link."?".http_build_query($data);		
		}	
	} else if("PATCH") {
		curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PATCH');
		array_push($headers, "Content-Type: application/json");
		curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
	}
	curl_setopt($curl,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl,CURLOPT_USERAGENT,'amoCRM-oAuth-client/1.0');
	curl_setopt($curl,CURLOPT_URL, $link);
	curl_setopt($curl,CURLOPT_HTTPHEADER, $headers);
	curl_setopt($curl,CURLOPT_HEADER, false);
	curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, 1);
	curl_setopt($curl,CURLOPT_SSL_VERIFYHOST, 2);

	// curl_setopt($curl, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5_HOSTNAME);
	// curl_setopt($curl, CURLOPT_PROXY, 'socks5h://45.128.205.169:1080');
	// curl_setopt($curl, CURLOPT_PROXYUSERPWD, 'zdravkurort:ZLWzeghShcWr');
	curl_setopt($curl, CURLOPT_TIMEOUT, 5); 
	
	$out = curl_exec($curl); //Инициируем запрос к API и сохраняем ответ в переменную
	$code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	curl_close($curl);
	/** Теперь мы можем обработать ответ, полученный от сервера. Это пример. Вы можете обработать данные своим способом. */
	$code = (int)$code;
	$errors = [
		400 => 'Bad request',
		401 => 'Unauthorized',
		403 => 'Forbidden',
		404 => 'Not found',
		500 => 'Internal server error',
		502 => 'Bad gateway',
		503 => 'Service unavailable',
	];

	try
	{
		/** Если код ответа не успешный - возвращаем сообщение об ошибке  */
		if ($code < 200 || $code > 204) {
			throw new Exception(isset($errors[$code]) ? $errors[$code] : 'Undefined error', $code);
		}
	}
	catch(\Exception $e)
	{
		echo 'Ответ сервера: ' . $out . PHP_EOL;
		// die('Ошибка: ' . $e->getMessage() . PHP_EOL . 'Код ошибки: ' . $e->getCode());
		throw $e;
	}
	sleep(0.7);
	return json_decode($out,true);
}

function sendRequestToAmo2($type, $url, $data = []) {
	global $subdomain;
	global $access_token;
	$link = 'https://' . $subdomain . $url; //Формируем URL для запроса
	/** Формируем заголовки */
	$headers = ['Authorization: Bearer ' . $access_token];

	/**
	 * Нам необходимо инициировать запрос к серверу.
	 * Воспользуемся библиотекой cURL (поставляется в составе PHP).
	 * Вы также можете использовать и кроссплатформенную программу cURL, если вы не программируете на PHP.
	 */
	$curl = curl_init(); //Сохраняем дескриптор сеанса cURL
	/** Устанавливаем необходимые опции для сеанса cURL  */
	if($type == "POST") {
		curl_setopt($curl, CURLOPT_POST, 1);
		// array_push($headers, "Content-Type: application/json");
		// curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
		if(gettype($data) === "string") {
			array_push($headers, "Content-Type: application/x-www-form-urlencoded");
			array_push($headers, "X-Requested-With: XMLHttpRequest");
			curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
		} else {
			array_push($headers, "Content-Type: application/json");
			curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
		}
	} else if($type == "GET") {
		if(count($data) > 0) {
			$link = $link."?".http_build_query($data);		
		}	
	} else if("PATCH") {
		curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PATCH');
		array_push($headers, "Content-Type: application/json");
		curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
	}
	curl_setopt($curl,CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl,CURLOPT_USERAGENT,'amoCRM-oAuth-client/1.0');
	curl_setopt($curl,CURLOPT_URL, $link);
	curl_setopt($curl,CURLOPT_HTTPHEADER, $headers);
	curl_setopt($curl,CURLOPT_HEADER, false);
	curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, 1);
	curl_setopt($curl,CURLOPT_SSL_VERIFYHOST, 2);

	// curl_setopt($curl, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5_HOSTNAME);
  	// curl_setopt($curl, CURLOPT_PROXY, 'socks5h://45.128.205.169:1080');
	// curl_setopt($curl, CURLOPT_PROXYUSERPWD, 'zdravkurort:ZLWzeghShcWr');

	curl_setopt($curl, CURLOPT_TIMEOUT, 5);
	
	$out = curl_exec($curl); //Инициируем запрос к API и сохраняем ответ в переменную
	vardump($out);
	$code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	curl_close($curl);
	/** Теперь мы можем обработать ответ, полученный от сервера. Это пример. Вы можете обработать данные своим способом. */
	$code = (int)$code;
	$errors = [
		400 => 'Bad request',
		401 => 'Unauthorized',
		403 => 'Forbidden',
		404 => 'Not found',
		500 => 'Internal server error',
		502 => 'Bad gateway',
		503 => 'Service unavailable',
	];

	try
	{
		/** Если код ответа не успешный - возвращаем сообщение об ошибке  */
		if ($code < 200 || $code > 204) {
			throw new Exception(isset($errors[$code]) ? $errors[$code] : 'Undefined error', $code);
		}
	}
	catch(\Exception $e)
	{
		vardump($e);
		die('Ошибка: ' . $e->getMessage() . PHP_EOL . 'Код ошибки: ' . $e->getCode());
	}
	sleep(0.7);
	return json_decode($out,true);
}

function authAMO($login, $hash, $subdomain) {
	$user = array(
		'USER_LOGIN' => $login, #Ваш логин (электронная почта)
		'USER_HASH' => $hash, #Хэш для доступа к API (смотрите в профиле пользователя)
	);
	#Формируем ссылку для запроса
	$link = 'https://' . $subdomain . '/private/api/auth.php?type=json';
	$curl = curl_init(); #Сохраняем дескриптор сеанса cURL
	#Устанавливаем необходимые опции для сеанса cURL
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_USERAGENT, 'amoCRM-API-client/1.0');
	curl_setopt($curl, CURLOPT_URL, $link);
	curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
	curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($user));
	curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
	curl_setopt($curl, CURLOPT_HEADER, false);
	curl_setopt($curl, CURLOPT_COOKIEFILE, dirname
		(__FILE__) . '/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
	curl_setopt($curl, CURLOPT_COOKIEJAR, dirname
		(__FILE__) . '/cookie.txt'); #PHP>5.3.6 dirname(__FILE__) -> __DIR__
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
	$out = curl_exec($curl); #Инициируем запрос к API и сохраняем ответ в переменную
	$code = curl_getinfo($curl, CURLINFO_HTTP_CODE); #Получим HTTP-код ответа сервера
	curl_close($curl); #Завершаем сеанс cURL
	// Теперь мы можем обработать ответ, полученный от сервера. Это пример. Вы можете обработать данные своим способом. 
	$code = (int) $code;
	$errors = array(
		301 => 'Moved permanently',
		400 => 'Bad request',
		401 => 'Unauthorized',
		403 => 'Forbidden',
		404 => 'Not found',
		500 => 'Internal server error',
		502 => 'Bad gateway',
		503 => 'Service unavailable',
	);
	try
	{
		#Если код ответа не равен 200 или 204 - возвращаем сообщение об ошибке
		if ($code != 200 && $code != 204) {
			throw new Exception(isset($errors[$code]) ? $errors[$code] : 'Undescribed error', $code);
		}

	} catch (Exception $E) {
		die('Ошибка: ' . $E->getMessage() . PHP_EOL . 'Код ошибки: ' . $E->getCode());
	}
	$Response = json_decode($out, true);
	$Response = $Response['response'];
	
	if (isset($Response['auth'])) #Флаг авторизации доступен в свойстве "auth"
	{
		return 'Авторизация прошла успешно';
	}

	return 'Авторизация не удалась';
}

function cors() {
	if (isset($_SERVER['HTTP_ORIGIN'])) {
			header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
			header('Access-Control-Allow-Credentials: true');
			header('Access-Control-Max-Age: 86400');
	}
	if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
			if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
					// may also be using PUT, PATCH, HEAD etc
					header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
			if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
					header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
			exit(0);
	}
}

function get_fcontent($url) {
  $curl_handle=curl_init();
  curl_setopt($curl_handle, CURLOPT_URL,$url);
  curl_setopt($curl_handle, CURLOPT_CONNECTTIMEOUT, 2);
  curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($curl_handle, CURLOPT_USERAGENT, 'Your application name');
  $query = curl_exec($curl_handle);
  curl_close($curl_handle);
}

// Как Sanatorium::termUnit в админке: период с датами перекрывает бессрочный, нет term_units — dayorsut.
function termUnitOn($san, $dateIn) {
	$periods = json_decode(isset($san['term_units']) ? $san['term_units'] : '', true);
	if(!is_array($periods) or count($periods) == 0) {
		return $san['dayorsut'];
	}

	$date = date('Y-m-d', strtotime($dateIn));
	$best = null;
	$bestBounds = -1;
	foreach($periods as $period) {
		$start = isset($period['date_start']) ? $period['date_start'] : null;
		$end = isset($period['date_end']) ? $period['date_end'] : null;
		if(($start !== null and $start > $date) or ($end !== null and $end < $date)) {
			continue;
		}
		$bounds = ($start !== null ? 1 : 0) + ($end !== null ? 1 : 0);
		if($bounds > $bestBounds) {
			$best = $period['unit'];
			$bestBounds = $bounds;
		}
	}

	return ($best === null) ? 'суток' : $best;
}


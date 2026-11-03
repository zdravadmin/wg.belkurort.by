<?php 
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL); //показываем все ошибки

//$today = mktime(date("H"), date("i"), date("s"), date("m"), date("d"), date("Y"));

//подключаем БД
require "../db_login.php";
require "../functions.php";
cors();
if(isset($_REQUEST['sanid'])) {
	$found = preg_replace("/[^0-9]/", '', $_REQUEST['sanid']);

	$stmt = $db->query('SELECT * FROM foundation where id ='.$found);
	$indb = $stmt->fetchAll();

	$stmt = $db->query('SELECT * FROM food where foundation_id ='.$found);
	$food = $stmt->fetchAll(PDO::FETCH_ASSOC);

	if(isset($indb[0]) and !is_null($indb[0])) {
		$indb = $indb[0];
		$checkin = !empty($_REQUEST['checkin']) ? $_REQUEST['checkin'] : 'today';

		$outarr = array(
		"error" => false,
		"kind" => $indb['type'],
		"name" => $indb['name'],
		"address" => $indb['address'],
		"denorsut" => termUnitOn($indb, $checkin),
		"raschas" => checkinTimeOn($indb, $checkin),
		"food" => $food,
		"stopSaleFrom" => $indb['stop_sale_from'],
		);
	} else {
		$outarr = array(
		"error" => true);
	}
	
	echo json_encode($outarr, JSON_UNESCAPED_UNICODE);
}
?>
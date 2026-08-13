<?php
require "../db_login.php";
require "../functions.php";

$format = 'Y-m-d';
$today = date($format);
// $today = '2025-01-27';
$tomorrow = date($format, strtotime("+1 day"));

setInnerCourses($today);
setInnerCourses($tomorrow);

function setInnerCourses($date) {
  global $db;

  $percent = 0.02;
  $percentMinus = 1-$percent;
  $percentPlus = 1+$percent;

  $st = $db->query("SELECT * FROM `inner_courses` where `date` = STR_TO_DATE('".$date."', '%Y-%m-%d') ORDER BY id desc");
  $existInnerCourses = $st->fetchAll()[0];

  if($existInnerCourses) {
    return;
  }

  $currency = getNBRB($date);

  if(!count($currency)) {
   return;
  }

  $RUB = getCurs($currency, 'RUB');
  $USD = getCurs($currency, 'USD');
  $EUR = getCurs($currency, 'EUR');

  $result = [
    "date" => $date,
    "BYNRUB" => round($RUB["Cur_OfficialRate"] * $percentMinus, 4),
    "RUBBYN" => round($RUB["Cur_OfficialRate"] * $percentPlus, 4),
    "BYNEUR" => round($EUR["Cur_OfficialRate"] * $percentMinus, 4),
    "EURBYN" => round($EUR["Cur_OfficialRate"] * $percentPlus, 4),
    "BYNUSD" => round($USD["Cur_OfficialRate"] * $percentMinus, 4),
    "USDBYN" => round($USD["Cur_OfficialRate"] * $percentPlus, 4),
    "RUBEUR" => round(getCross($RUB, $EUR) * $percentMinus, 4),
    "EURRUB" => round(getCross($RUB, $EUR) * $percentPlus, 4),
    "RUBUSD" => round(getCross($RUB, $USD) * $percentMinus, 4),
    "USDRUB" => round(getCross($RUB, $USD) * $percentPlus, 4),
    "EURUSD" => round(getCross($USD, $EUR) * $percentMinus, 4), 
    "USDEUR" => round(getCross($USD, $EUR) * $percentPlus, 4),
  ];

  $query = "INSERT INTO `inner_courses` (".implode(",",array_keys($result)).") 
  VALUES (".implode(",", array_map(function($el) {return ':'.$el;}, array_keys($result))).");";

  $db->prepare($query)->execute($result);
  return;
}


// Сколько primary в secondary
function getCross($primary, $secondary) {
  $oneBYNInPrimary = $primary["Cur_Scale"] / $primary["Cur_OfficialRate"];
  $oneBYNInSecondary = $secondary["Cur_Scale"] / $secondary["Cur_OfficialRate"];
  return $oneBYNInPrimary / $oneBYNInSecondary;
}

function getCurs($currency, $val) {
  return array_values(array_filter($currency, function($el) use ($val) { return $el["Cur_Abbreviation"] === $val;}))[0];
}

function getNBRB($date) {
  $myURL = 'https://www.nbrb.by/API/ExRates/Rates?Periodicity=0&ondate='.$date;
		
  $curl = curl_init();
  curl_setopt($curl, CURLOPT_URL, $myURL);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  $content = curl_exec($curl);
  curl_close($curl);
  return json_decode($content,true);
}
?>
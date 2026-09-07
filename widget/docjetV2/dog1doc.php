<?php
//ini_set('display_errors',1);
//error_reporting(E_ALL);
	$temp_name = explode(" ",$data['name_manager']);
	$manager_insert = $temp_name[0]." ".substr($temp_name[1], 0, 2);
	if(isset($temp_name[2])) {
			$manager_insert = $manager_insert.". ".substr($temp_name[2], 0, 2).".";
	}

require_once 'src/autoload.php';

$data['stamp'] = 'oval_stamp';

if($data['sign'] == '3406348') {
	$data['sign'] = 'null';
	$data['stamp'] = 'null';
}

if($data['type_oplaty'] == "Эквайринг") {
	$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/dog_template.docx'); //шаблон
} else {
	$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/dog_template_and_bill.docx'); //шаблон
	if($pril["is_all_price_not_null"]) {
		$shet = [];
		$innerValutesOnDate = getInnerCursesFromDB($data['data_dogovora']);
		$data['stoimost_sanatoriya'] = 0;
		foreach($pril['going'] as $guest) {
			$data['stoimost_sanatoriya'] += converterValut($guest["price"], $guest["valuta_price"], $valuta, $innerValutesOnDate);
			$checkin = (isset($guest["guestcheckin"])) ? $guest["guestcheckin"] : date("d.m.Y",strtotime($data['data_zaezda']));
			$checkout = (isset($guest["guestcheckout"])) ? $guest["guestcheckout"] : date("d.m.Y",strtotime($data['data_vyezda']));
			array_push($shet,
				array(
					'tid'        => $guest["id"],
					'tusl' => mb_strtoupper(mb_substr($data['dog_s_lecheniem'], 0, 1, 'UTF-8'), 'UTF-8').mb_substr($data['dog_s_lecheniem'], 1, null,'UTF-8').' в соответствии с программой туристического путешествия в '.$data['dog_naimenovanie_obekta_razmescheniya'].' с '.$checkin.' по '.$checkout.' для гостя '.$guest['just_fio'],
					'ted_izm'      => 'шт.',
					'tkol_vo'     => '1',
					'tcost'     => converterValut($guest["price"], $guest["valuta_price"], $valuta, $innerValutesOnDate),
					'tsum'     => converterValut($guest["price"], $guest["valuta_price"], $valuta, $innerValutesOnDate),
				));
		}
	} else {
		$shet = array(
			array(
				'tid'        => 1,
				'tusl' => mb_strtoupper(mb_substr($data['dog_s_lecheniem'], 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($data['dog_s_lecheniem'], 1, null,'UTF-8').' в соответствии с программой туристического путешествия в '.$data['dog_naimenovanie_obekta_razmescheniya'].' с '.date("d.m.Y",strtotime($data['data_zaezda'])).' по '.date("d.m.Y",strtotime($data['data_vyezda'])).' для '.$data['kolichestvo_turistov'].' человек(-а)',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'tcost'     => $data['stoimost_sanatoriya'],
				'tsum'     => $data['stoimost_sanatoriya'],
			)
		);
	}
	
	$data['cena_uslug'] = $data['stoimost_sanatoriya'] + $data['infouslugi'] + $data['turobsluzhivanie'] + $sumtransfer + $data['sum_novogod_banketa'] + $data['sum_novogod_program'];

if($data['turobsluzhivanie'] != 0) {
	array_push($shet, array(
			'tid' => (count($shet)+1),
			'tusl' => 'Организация комплексного туристического обслуживания',
			'ted_izm'      => 'шт.',
			'tkol_vo'     => '1',
			'tcost'     => $data['turobsluzhivanie'],
			'tsum'     => $data['turobsluzhivanie']
	));
};

if($data['infouslugi'] != 0) {
array_push($shet, array(
		'tid' => (count($shet)+1),
		'tusl' => 'Туристические информационные услуги',
		'ted_izm'      => 'шт.',
        'tkol_vo'     => '1',
		'tcost'     => $data['infouslugi'],
		'tsum'     => $data['infouslugi']
));
};

if($sumtransfer != 0) {
array_push($shet, array(
		'tid' => (count($shet)+1),
		'tusl' => 'Организация перевозки туристов автомобильным транспортом (трансфер)',
		'ted_izm'      => 'шт.',
        'tkol_vo'     => '1',
		'tcost'     => $sumtransfer,
		'tsum'     => $sumtransfer
));
};

if($data['sum_novogod_banketa'] != 0) {
array_push($shet, array(
		'tid' => (count($shet)+1),
		'tusl' => 'Организация новогоднего банкета',
		'ted_izm'      => 'шт.',
        'tkol_vo'     => '1',
		'tcost'     => $data['sum_novogod_banketa'],
		'tsum'     => $data['sum_novogod_banketa']
));
};

if($data['sum_novogod_program'] != 0) {
	array_push($shet, array(
			'tid' => (count($shet)+1),
			'tusl' => 'Организация новогодней программы',
			'ted_izm'      => 'шт.',
					'tkol_vo'     => '1',
			'tcost'     => $data['sum_novogod_program'],
			'tsum'     => $data['sum_novogod_program']
	));
};

if($data['sum_novogod_utrennika'] != 0) {
array_push($shet, array(
		'tid' => (count($shet)+1),
		'tusl' => 'Организация детского новогоднего утренника',
		'ted_izm'      => 'шт.',
        'tkol_vo'     => '1',
		'tcost'     => $data['sum_novogod_utrennika'],
		'tsum'     => $data['sum_novogod_utrennika']
));
};

$document->cloneRowAndSetValues('tid', $shet);
}

// $covid = $data['rf_spravka_covid'];
// if(isset($data['rf_test_covid'])) {
// 	$covid = $covid." ".$data['rf_test_covid'];
// }

// if(!$data["not_rb"]) {
// 	$covid = $data['rb_spravka_covid'];
// 	if(isset($data['rb_test_covid'])) {
// 		$covid = $covid." ".$data['rb_test_covid'];
// 	}
// }

$rbcovid = "";
if($data['san_country'] == "РБ" and $data["not_rb"]) {
	$rbcovid = ", а также доведены нормы Постановления Совета министров РБ от 25.03.2020 №171 «О мерах по предотвращению завоза и распространения инфекции, вызванной коронавирусом COVID-19»";
};


//$document->setValue('prilozhenie', $data['prilozhenie']);
$document->setValue('ekvayring', $data['ekvayring']);
$document->setValue('pitanie', $data['pitanie']);
$document->setValue('dog_chasy_zaezda_vyezda', $data['dog_chasy_zaezda_vyezda']);
$document->setValue('kolichestvo_nomerov', $data['kolichestvo_nomerov']);
$document->setValue('tip_nomera',$data['tip_nomera']);
$document->setValue('dog_transfer', $data['dog_transfer']);
$document->setValue('data_vyezda', date("d.m.Y",strtotime($data['data_vyezda'])));
$document->setValue('data_zaezda', date("d.m.Y",strtotime($data['data_zaezda'])));
$document->setValue('dog_adres_obekta_razmescheniya', $data['dog_adres_obekta_razmescheniya']);
$document->setValue('dog_naimenovanie_obekta_razmescheniya', $data['dog_naimenovanie_obekta_razmescheniya']);
$document->setValue('dog_transfer_fraza_2', $data['dog_transfer_fraza_2']);
$document->setValue('dog_schet', $data['dog_schet']);
$document->setValue('turist_dogovor_fio_pasport_propiska', $data['turist_dogovor_fio_pasport_propiska']);
$document->setValue('turist_dogovor_fio_pasport_propiska_short', $data['turist_dogovor_fio_pasport_propiska_short']);
$document->setValue('dog_transfer_fraza', $data['dog_transfer_fraza']);
$document->setValue('stoimost_sanatoriya', $data['stoimost_sanatoriya']);
$document->setValue('dog_s_lecheniem', $data['dog_s_lecheniem']);
$document->setValue('infouslugi', $data['infouslugi']);
$document->setValue('turobsluzhivanie', $data['turobsluzhivanie']);
$document->setValue('valyuta', $data['valyuta']);
$document->setValue('cena_uslug', $data['cena_uslug']);
$document->setValue('kolichestvo_turistov', $data['kolichestvo_turistov']);
$document->setValue('data_dogovora', date("d.m.Y",strtotime($data['data_dogovora'])));
$document->setValue('nomer_dogovora', $data['nomer_dogovora']);
$document->setValue('newyear', $data['newyear']);
$document->setValue('new_year_utrennik', $data['new_year_utrennik']);
$document->setValue('sum_new_year', $data['sum_new_year']);
$document->setValue('sum_new_year_utrennik', $data['sum_new_year_utrennik']);
$document->setValue('newyear_program', $data['newyear_program']); //!
$document->setValue('sum_new_year_program', $data['sum_new_year_program']); //!
$document->setValue('name_manager', $manager_insert);
$document->setValue('podpis', $data['podpis']);
$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setValue('korschet', $data['korschet']);
$document->setValue('korschet_shet', $data['korschet_shet']);
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => 180, 'height' => 180, 'ratio' => true));//!
$document->setValue('covid', $covid);
$document->setValue('rbcovid', $rbcovid);
$document->setValue('kurort_sbor', $data['kurort_sbor']);
$document->setValue('salesdetails', $data['prilozhenieUpd'][0]["salesdetails"]);
$document->setValue('oplata_po_schetu', $data['oplata_po_schetu']);

$document->setValue('pay_days', $data['due_days']); 
$document->setValue('pay_hours', $data['due_hours']);

$document->cloneRowAndSetValues('prilozhenie', $data['prilozhenieUpd']);

$fio = explode(",",$data['turist_dogovor_fio_pasport_propiska']);

// Далее отправляем файл в браузер
if (!file_exists("docs/".$card_id)) {
    mkdir("docs/".$card_id, 0777, true);
	}
	
$date = date('d-m-Y');
$time = date('H:i:s');
// $path = "docs/".$card_id.'/'.$date.' '.$time.' Договор '.explode(" ",$fio[0])[0].'.docx';
$path = "wievDoc/".$date.' '.$time.' Договор '.explode(" ",$fio[0])[0].'.docx';
ob_clean();
$document ->saveAs($path);

require_once 'yaDiskFunc.php';
saveFileToYaDisk('leads', $card_id, '/Генерация', $path);

		header("Content-Type: text/html; charset=utf-8");
		header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename='.'Договор '.explode(" ",$fio[0])[0].'.docx');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
		header('Content-Length: ' . filesize($path));
    flush();
		readfile($path);

// примечание к сделке
//$fio_insert = str_replace(" ", "%20", explode(" ",$fio[0])[0]);
// create_note($card_id, 'Сформирован Договор на скачивание: http://wg.belkurort.by/widget/docjetV2/'."docs/".$card_id.'/'.$date.'%20'.$time.'%20Договор%20'.$fio_insert.'.docx', $manager);
/*
//переводим сделку в статус договора, если она не в нём
if(!in_array($lead['status_id'],['26081356','26726761','142','28291732'])) {
	 $leadinamo = $amo->lead;
	 $leadinamo['status_id'] = 26081356;
	 $leadinamo->apiUpdate((int)$lead['id'], 'now');
};*/
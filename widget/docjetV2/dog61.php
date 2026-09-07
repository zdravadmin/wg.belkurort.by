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
$data['vh_stamp'] = 180;

if($data['sign'] == '3406348') {
	$data['stamp'] = 'round_stamp';
	$data['vh_stamp'] = 150;
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
	$rbcovid = ", а так же доведены нормы Постановления Совета министров РБ от 25.03.2020 №171 «О мерах по предотвращению завоза и распространения инфекции, вызванной коронавирусом COVID-19»";
};


$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/dog_template_and_bill_prepay.docx'); //шаблон
/*
if($data['type_oplaty'] == "Эквайринг") {
	$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/dog_template.docx'); //шаблон
} else {
	$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/dog_template_and_bill.docx'); //шаблон
	$shet = array(
    array(
        'tid'        => 1,
        'tusl' => 'Путёвка в '.$data['dog_naimenovanie_obekta_razmescheniya'].' с '.date("d.m.Y",strtotime($data['data_zaezda'])).' по '.date("d.m.Y",strtotime($data['data_vyezda'])).' для '.$data['kolichestvo_turistov'].' человек(-а)',
        'ted_izm'      => 'шт.',
        'tkol_vo'     => '1',
		'tcost'     => $data['stoimost_sanatoriya'],
		'tsum'     => $data['stoimost_sanatoriya'],
    )
);

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

$document->cloneRowAndSetValues('tid', $shet);
}*/

$document->setValue('minus_2_month', $data['data_zaezda_minus_2_month']);
//$document->setValue('data_predopl_fact', $data['data_predopl_fact']);
$document->setValue('sum_predopl_fact', $data['sum_predopl_dlya_dogovora']);


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
$document->setValue('sum_new_year', $data['sum_new_year']);
$document->setValue('new_year_utrennik', $data['new_year_utrennik']);
$document->setValue('sum_new_year_utrennik', $data['sum_new_year_utrennik']);
$document->setValue('newyear_program', $data['newyear_program']); //!
$document->setValue('sum_new_year_program', $data['sum_new_year_program']); //!
$document->setValue('name_manager', $manager_insert);
$document->setValue('podpis', $data['podpis']);
$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setValue('korschet', $data['korschet']);
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => $data['vh_stamp'], 'height' => $data['vh_stamp'], 'ratio' => true));//!
$document->setValue('covid', $covid);
$document->setValue('rbcovid', $rbcovid);
$document->setValue('kurort_sbor', $data['kurort_sbor']);

$document->setValue('salesdetails', $data['prilozhenieUpd'][0]["salesdetails"]);
 
$document->setValue('pay_hours', $data['due_hours']);

$document->cloneRowAndSetValues('prilozhenie', $data['prilozhenieUpd']);

$fio = explode(",",$data['turist_dogovor_fio_pasport_propiska']);

// Далее отправляем файл в браузер
if (!file_exists("docs/".$card_id)) {
    mkdir("docs/".$card_id, 0777, true);
	}
	
$date = date('d-m-Y');
$time = date('H:i:s');
ob_clean();
// $docfilename = "docs/".$card_id.'/'.$date.' '.$time.' Договор '.explode(" ",$fio[0])[0].'.docx';
$docfilename = "wievDoc/".$date.' '.$time.' Договор '.explode(" ",$fio[0])[0].'.docx';
$document ->saveAs($docfilename);

//Генерим pdf
require_once 'pdf_function.php';
$pdfUrl = getPdfUrl($docfilename);
$pdfUrl = preg_replace("/ /","%20",$pdfUrl);

require_once 'yaDiskFunc.php';
saveFileByLinkOnYaDisk( $pdfUrl, 
                        'leads', 
                        $card_id, 
                        'Частичный договор '.explode(" ",$fio[0])[0].'.pdf', 
                        '/Генерация');
/*
require_once 'ilovepdf/init.php';
$ilovepdf = (rand(1,2) == 1) ? new Ilovepdf\Ilovepdf('project_public_49e6b7c8e53ef8884b9e72bef42f2179_u5iL104a5d099045bd2e9c624ba89a2674068','secret_key_c60779739c2de8799eaea8ad848e36ce_4M_LYfbd53a674f76b806e05f7219305a19dc') : new Ilovepdf\Ilovepdf('project_public_0dc74e037e4a92250bdef7ba9b17e5b0_Isjsm3bea716e1223fca7a5daf1a65890d856','secret_key_910e4f071b8616f5d9d402dbd3d8f4a7_lQTlma6bdda657debf4d372831ce97db7876e');
$myTaskConvertOffice = $ilovepdf->newTask('officepdf');
$file1 = $myTaskConvertOffice->addFile($docfilename);
$myTaskConvertOffice->execute();
$myTaskConvertOffice->download("docs/".$card_id);

$pdfUrl = "https://wg.belkurort.by/widget/docjetV2/docs/".$card_id.'/'.$date.'%20'.$time.'%20Договор%20'.explode(" ",$fio[0])[0].'.pdf';
*/
// примечание к сделке
// create_note($card_id, 'Сформирован Договор 0.5: '.$pdfUrl, $manager);

//Переходим к документу
flush();
header ('Location: '.$pdfUrl);
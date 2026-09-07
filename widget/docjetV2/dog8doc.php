<?php
//ini_set('display_errors',1);
//error_reporting(E_ALL);
require_once 'src/autoload.php';

$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/dop_dopl_perenos.docx'); //шаблон

$fio = explode(",",$data['turist_dogovor_fio_pasport_propiska']);
$f = explode(" ",$fio[0]);
$allpay = (int)$data['sum_predopl_fact'] + (int)$data['sum_all_pay_fact'];
$finpay = (int)$data['cena_uslug'] - (int)$allpay;


$format = new NumberFormatter("ru", NumberFormatter::SPELLOUT);

//$document->setValue('prilozhenie', $data['prilozhenie']);
$document->setValue('ekvayring', $data['ekvayring']);//
$document->setValue('pitanie', $data['pitanie']);//
$document->setValue('dog_chasy_zaezda_vyezda', $data['dog_chasy_zaezda_vyezda']);//
$document->setValue('kolichestvo_nomerov', $data['kolichestvo_nomerov']);//
$document->setValue('tip_nomera',$data['tip_nomera']);//
$document->setValue('dog_transfer', $data['dog_transfer']);//
$document->setValue('data_vyezda', date("d.m.Y",strtotime($data['data_vyezda'])));//
$document->setValue('data_zaezda', date("d.m.Y",strtotime($data['data_zaezda'])));//
$document->setValue('dog_adres_obekta_razmescheniya', $data['dog_adres_obekta_razmescheniya']);//
$document->setValue('dog_naimenovanie_obekta_razmescheniya', $data['dog_naimenovanie_obekta_razmescheniya']);//
$document->setValue('dog_schet', $data['dog_schet']);//
$document->setValue('turist_dogovor_fio_pasport_propiska', $data['turist_dogovor_fio_pasport_propiska']);//
$document->setValue('dog_transfer_fraza', $data['dog_transfer_fraza']);//
$document->setValue('stoimost_sanatoriya', $data['stoimost_sanatoriya']);//
$document->setValue('dog_s_lecheniem', $data['dog_s_lecheniem']);//
$document->setValue('infouslugi', $data['infouslugi']);//
$document->setValue('turobsluzhivanie', $data['turobsluzhivanie']);//
$document->setValue('valyuta', $data['valyuta']);//
$document->setValue('cena_uslug', $data['cena_uslug']);//
$document->setValue('sum_fact_oplaty', $allpay);//
$document->setValue('sum_fact_oplaty_propis', $format->format($allpay));//
$document->setValue('sum_fin_pay', $finpay);//
$document->setValue('sum_fin_pay_propis', $format->format($finpay));//
$document->setValue('last_pay_date', (isset($data['data_all_pay_fact'])) ? date("d.m.Y",strtotime($data['data_all_pay_fact'])) : date("d.m.Y",strtotime($data['data_predopl_fact'])));//
$document->setValue('data_dogovora', date("d.m.Y",strtotime($data['data_dogovora'])));//
$document->setValue('nomer_dogovora', $data['nomer_dogovora']); //
$document->setValue('today', date("d.m.Y"));//
$document->setValue('fio_tourist', $fio[0]);//
$document->setValue('sum_new_year', $data['sum_new_year']);
$document->setValue('sum_new_year_utrennik', $data['sum_new_year_utrennik']);
$document->setValue('sum_new_year_program', $data['sum_new_year_program']); //!
$document->setValue('korschet', $data['korschet']);//
$document->setValue('FIO_client', mb_convert_encoding($f[0]." ".mb_substr($f[1],0,1,'utf-8').". ".mb_substr($f[2],0,1,'utf-8').".","UTF-8"));//
/*
$document->setValue('boss_name', $data['boss_name']);
$document->setValue('boss_podpis', $data['boss_podpis']);
$document->setValue('boss_dolzhnost', $data['boss_dolzhnost']);
*/

$document->setValue('podpis', $data['podpis']);
$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setValue('name_manager', $data['short_name_manager']);

$data['stamp'] = 'oval_stamp';
if($data['sign'] == '3406348') {
	$data['sign'] = 'null';
	$data['stamp'] = 'null';
}
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => 180, 'height' => 180, 'ratio' => true));

$fio = explode(",",$data['turist_dogovor_fio_pasport_propiska']);//

// Далее отправляем файл в браузер
$date = date('d-m-Y');
$time = date('H:i:s');
ob_clean();
$path_of_doc = "wievDoc/".$date.' '.$time.' Доп. соглашение '.explode(" ",$fio[0])[0].'.docx';
$document ->saveAs($path_of_doc);

require_once 'yaDiskFunc.php';
saveFileToYaDisk('leads', $card_id, '/Генерация', $path_of_doc);

		header('Content-Type: text/html; charset=utf-8');
		header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename='.'Доп. соглашение '.explode(" ",$fio[0])[0].'.docx');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
		header('Content-Length: ' . filesize($path_of_doc));
        flush();
		readfile($path_of_doc);

<?php
//ini_set('display_errors',1);
//error_reporting(E_ALL);

	$temp_name = explode(" ",$data['name_manager']);
	$manager_insert = $temp_name[0]." ".substr($temp_name[1], 0, 2);
		if(isset($temp_name[2])) {
			$manager_insert = $manager_insert.". ".substr($temp_name[2], 0, 2).".";
	}

$data['stamp'] = 'oval_stamp';
if($data['sign'] == '3406348') {
	$data['sign'] = 'null';
	$data['stamp'] = 'null';
}

$data['dog_chasy_zaezda_vyezda'] = $bodytag = str_replace(",",', <w:br/>', $data['dog_chasy_zaezda_vyezda']);

require_once 'src/autoload.php';
$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/permit_template.docx'); //шаблон

$document->setValue('nomer_dogovora', $data['nomer_dogovora']);
$document->setValue('data_vyezda', date("d.m.Y",strtotime($data['data_vyezda'])));
$document->setValue('data_zaezda', date("d.m.Y",strtotime($data['data_zaezda'])));
$document->setValue('dog_chasy_zaezda_vyezda', $data['dog_chasy_zaezda_vyezda']);
$document->setValue('dog_naimenovanie_obekta_razmescheniya', $data['dog_naimenovanie_obekta_razmescheniya']);
$document->setValue('dog_adres_obekta_razmescheniya', $data['dog_adres_obekta_razmescheniya']);
$document->setValue('dog_lechenie', preg_replace("/[^а-яёa-z]/iu", '', $data['dog_lechenie']));
$document->setValue('kolichestvo_nomerov', $data['kolichestvo_nomerov']);
$document->setValue('tip_nomera', $data['tip_nomera']);
$document->setValue('turist_5', $data['turist_5']);
$document->setValue('turist_4', $data['turist_4']);
$document->setValue('turist_3', $data['turist_3']);
$document->setValue('turist_2', $data['turist_2']);
//$document->setValue('dog_edet_li_turist_dogovor', $data['dog_edet_li_turist_dogovor']);
$document->setValue('name_manager', $manager_insert);
//$document->setValue('prilozhenie', $data['prilozhenie']);

$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => 180, 'height' => 180, 'ratio' => true));//!
$document->cloneBlock('block_name', 0, true, false, $data['prilozhenieUpd']);
$fio = explode(",",$data['turist_dogovor_fio_pasport_propiska']);
$timestamp = strtotime("now");
$docname = "wievDoc/".$timestamp.'putevka.docx';

if (file_exists($docname)) {
    unlink($docname);
	}
ob_clean();
$document->saveAs($docname);
flush();
header('Location: https://view.officeapps.live.com/op/view.aspx?src='.urlencode('http://wg.belkurort.by/widget/docjetV2/'.$docname));
flush();
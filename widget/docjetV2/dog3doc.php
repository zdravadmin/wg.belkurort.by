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
$document->cloneBlock('block_name', 0, true, false, $data['prilozhenieUpd']);
$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => 180, 'height' => 180, 'ratio' => true));//!
 
$fio = explode(",",$data['dog_edet_li_turist_dogovor']);

// Далее отправляем файл в браузер
if (!file_exists("docs/".$card_id)) {
    mkdir("docs/".$card_id, 0777, true);
	}
$date = date('d-m-Y');
$time = date('H:i:s');
ob_clean();
// $path = "docs/".$card_id.'/'.$date.' '.$time.' Путевка '.explode(" ",$fio[0])[0].'.docx';
$path = "wievDoc/".$date.' '.$time.' Путевка '.explode(" ",$fio[0])[0].'.docx';
$file = $document ->saveAs($path);

require_once 'yaDiskFunc.php';
saveFileToYaDisk('leads', $card_id, '/Генерация', $path);

		header("Content-Type: text/html; charset=utf-8");  
		header("Cache-Control: public");
		header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename='.'Путевка '.explode(" ",$fio[0])[0].'.docx');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
		header('Content-Length: ' . filesize($path));
		readfile($path);
flush();

//$fio_insert = str_replace(" ", "%20", explode(" ",$fio[0])[0]);
//create_note($card_id, 'Сформирована Санаторно-курортная путевка: http://wg.belkurort.by/widget/docjetV2/'."docs/".$card_id.'/'.$date.'%20'.$time.'%20Путевка%20'.$fio_insert.'.docx');
unlink($path);
exit;
?>
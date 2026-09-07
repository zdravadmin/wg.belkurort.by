<?php
//ini_set('display_errors',1);
//error_reporting(E_ALL);

	$temp_name = explode(" ",$data['name_manager']);
	$manager_insert = $temp_name[0]." ".substr($temp_name[1], 0, 2);
		if(isset($temp_name[2])) {
			$manager_insert = $manager_insert.". ".substr($temp_name[2], 0, 2).".";
	}

$data['stamp'] = 'oval_stamp';
$data['vh_stamp'] = 180;

if($data['sign'] == '3406348' or $manager == '7974150') {
	$data['stamp'] = 'round_stamp';
	$data['vh_stamp'] = 150;
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
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => $data['vh_stamp'], 'height' => $data['vh_stamp'], 'ratio' => true));//!
 
$fio = explode(",",$data['dog_edet_li_turist_dogovor']);

// Далее отправляем файл в браузер
if (!file_exists("docs/".$card_id)) {
    mkdir("docs/".$card_id, 0777, true);
	}
$date = date('d-m-Y');
$time = date('H:i:s');
ob_clean();
// $docfilename = "docs/".$card_id.'/'.$date.' '.$time.' Путевка '.explode(" ",$fio[0])[0].'.docx';
$docfilename = "wievDoc/".$date.' '.$time.' Путевка '.explode(" ",$fio[0])[0].'.docx';
$document ->saveAs($docfilename);

//Генерим pdf

require_once 'pdf_function.php';
$pdfUrl = getPdfUrl($docfilename);
$pdfUrl = preg_replace("/ /","%20",$pdfUrl);

require_once 'yaDiskFunc.php';
saveFileByLinkOnYaDisk( $pdfUrl, 
                        'leads', 
                        $card_id, 
                        'Путёвка '.explode(" ",$fio[0])[0].'.pdf', 
                        '/Генерация');
/*
require_once 'ilovepdf/init.php';
$ilovepdf = (rand(1,2) == 1) ? new Ilovepdf\Ilovepdf('project_public_49e6b7c8e53ef8884b9e72bef42f2179_u5iL104a5d099045bd2e9c624ba89a2674068','secret_key_c60779739c2de8799eaea8ad848e36ce_4M_LYfbd53a674f76b806e05f7219305a19dc') : new Ilovepdf\Ilovepdf('project_public_0dc74e037e4a92250bdef7ba9b17e5b0_Isjsm3bea716e1223fca7a5daf1a65890d856','secret_key_910e4f071b8616f5d9d402dbd3d8f4a7_lQTlma6bdda657debf4d372831ce97db7876e');
$myTaskConvertOffice = $ilovepdf->newTask('officepdf');
$file1 = $myTaskConvertOffice->addFile($docfilename);
$myTaskConvertOffice->execute();
$myTaskConvertOffice->download("docs/".$card_id);

$pdfUrl = "https://wg.belkurort.by/widget/docjetV2/docs/".$card_id.'/'.$date.'%20'.$time.'%20Путевка%20'.explode(" ",$fio[0])[0].'.pdf';
*/
// $fio_insert = str_replace(" ", "%20", explode(" ",$fio[0])[0]);
// create_note($card_id, 'Сформирована санаторно-курортная путевка: '.$pdfUrl, $manager);
unlink($docfilename);

//Переходим к документу
flush();
header ('Location: '.$pdfUrl);
?>
<?php
//ini_set('display_errors',1);
//error_reporting(E_ALL);
	$temp_name = explode(" ",$data['name_manager']);
	$otchestvo = (isset($temp_name[2])) ? substr($temp_name[2], 0, 2)."." : "";
	$manager_insert = $temp_name[0]." ".substr($temp_name[1], 0, 2).". ".$otchestvo;
	$data['numrequest'] = (isset($data['numrequest'])) ? $data['numrequest'] : "Б/Н";
 
 if($data['sign'] == '3406348') {
	$data['sign'] = 'null';
}
 
require_once 'src/autoload.php';


// $document = (date("m",strtotime($data['data_vyezda'])) < date("m",strtotime($data['data_zaezda']))) ? new PhpOffice\PhpWord\TemplateProcessor('templatesV2/booking_template_with_banket.docx') : new PhpOffice\PhpWord\TemplateProcessor('templatesV2/booking_template.docx'); //шаблон
$document = new PhpOffice\PhpWord\TemplateProcessor('templatesV2/booking_template.docx');


$document->setValue('today', date("d.m.Y"));
$document->setValue('dog_naimenovanie_obekta_razmescheniya', $data['dog_naimenovanie_obekta_razmescheniya']);
$document->setValue('data_vyezda', date("d.m.Y",strtotime($data['data_vyezda'])));
$document->setValue('data_zaezda', date("d.m.Y",strtotime($data['data_zaezda'])));
$document->setValue('kolichestvo_dney', $data['kolichestvo_dney']);
$document->setValue('sutki_dni', $data['sutki_dni']);
$document->setValue('tip_putevki', $data['tip_putevki']);
$document->setValue('kolichestvo_nomerov', $data['kolichestvo_nomerov']);
$document->setValue('tip_nomera', $data['tip_nomera']);
$document->setValue('name_manager', $manager_insert);
$document->setValue('primechanie_v_zayavke', $data['primechanie_v_zayavke']);
$document->setValue('numrequest', $data['numrequest']);
$document->setValue('book_type', $data['book_type']);
// $document->setValue('banket_list', $data['banket_list']);

$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));

$document->cloneRowAndSetValues('id', $data['prilozhenie']);

$fio = explode(",",$data['dog_edet_li_turist_dogovor']);

// $docname = "wievDoc/".date("Y-m-d-H-i-s","now").'book.docx';
$docname = "wievDoc/".time().'book.docx';
ob_clean();
$document->saveAs($docname);
flush();
// sleep(1);
//header('Location: https://view.officeapps.live.com/op/view.aspx?src='.urlencode('http://wg.belkurort.by/widget/docjetV2/'.$docname));
header('Location: http://docs.google.com/viewer?url=http://wg.belkurort.by/widget/docjetV2/'.urlencode($docname).'&embedded=true');
//header('Location: http://docs.google.com/viewer?url=http://wg.belkurort.by/widget/docjetV2/'.$docname);
flush();
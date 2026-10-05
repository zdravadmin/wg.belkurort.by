<?php
//ini_set('display_errors',1);
//error_reporting(E_ALL);

	$temp_name = explode(" ",$data['name_manager']);
	$otchestvo = (isset($temp_name[2])) ? substr($temp_name[2], 0, 2)."." : "";
	$manager_insert = $temp_name[0]." ".substr($temp_name[1], 0, 2).". ".$otchestvo;

require_once 'src/autoload.php';
do{
$document = (date("m",strtotime($data['data_vyezda'])) < date("m",strtotime($data['data_zaezda']))) ? new PhpOffice\PhpWord\TemplateProcessor('templatesV2/null_template_with_banket.docx') : new PhpOffice\PhpWord\TemplateProcessor('templatesV2/null_template.docx'); //шаблон

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
//$document->setValue('prilozhenie', preg_replace('/, услуги,[^;]+;/', "", $data['prilozhenie']));
$document->setValue('numrequest', $data['numrequest']);

$document->setValue('primechanie_v_annul', $data['primechanie_v_annul']);
$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
 
$document->cloneRowAndSetValues('id', $data['prilozhenie']);
 
$fio = explode(",",$data['dog_edet_li_turist_dogovor']);

// Далее отправляем файл в браузер
if (!file_exists("docs/".$card_id)) {
    mkdir("docs/".$card_id, 0777, true);
	}
$date = date('d-m-Y');
$time = date('H:i:s');
$doc = 'wievDoc/'.$date.' '.$time.' annulatsia '.explode(" ",$fio[0])[0].'.docx';
$document->saveAs($doc);

$doc2 = 'wievDoc/'.$date.' '.$time.' annulatsia '.explode(" ",$fio[0])[0].'.pdf';

//Генерим pdf
require_once 'pdf_function.php';
$pdfUrl = getPdfUrl($doc);
$pdfUrl = preg_replace("/ /","%20",$pdfUrl);

file_put_contents('./'.$doc2, file_get_contents($pdfUrl));

/*
require_once 'ilovepdf/init.php';
$ilovepdf = (rand(1,2) == 1) ? new Ilovepdf\Ilovepdf('project_public_49e6b7c8e53ef8884b9e72bef42f2179_u5iL104a5d099045bd2e9c624ba89a2674068','secret_key_c60779739c2de8799eaea8ad848e36ce_4M_LYfbd53a674f76b806e05f7219305a19dc') : new Ilovepdf\Ilovepdf('project_public_0dc74e037e4a92250bdef7ba9b17e5b0_Isjsm3bea716e1223fca7a5daf1a65890d856','secret_key_910e4f071b8616f5d9d402dbd3d8f4a7_lQTlma6bdda657debf4d372831ce97db7876e');
$myTaskConvertOffice = $ilovepdf->newTask('officepdf');
$file1 = $myTaskConvertOffice->addFile($doc);
$myTaskConvertOffice->execute();
$myTaskConvertOffice->download("wievDoc/");

$pdfUrl = "https://wg.belkurort.by/widget/docjetV2/".$doc2;
*/
$fio_insert = str_replace(" ", "%20", explode(" ",$fio[0])[0]);
} while (!file_exists($doc));

require_once 'functions.php';
if(sendEmail(explode(" ",$fio[0])[0]." ".explode(" ",$fio[0])[1], $manager_insert, "Аннуляция заявки №".$data['numrequest'], $data['email'], $data['dog_naimenovanie_obekta_razmescheniya'], "/".$doc2)) {
	sleep(1);
	//Записываем ссылку на письмо в сделку amo
	require_once("../../auth.php");
	$lead = $amo->lead;
	$lead->addCustomField(305353, "https://mail.yandex.by/?uid=1130000038153703#search?request=Аннуляция".str_replace(" ","%20"," ".explode(" ",$fio[0])[0]." ".$data['dog_naimenovanie_obekta_razmescheniya']));
	$lead->addCustomField(305351, "");
	$lead->addCustomField(796948, false);
	$lead->apiUpdate((int)$card_id, 'now');
	//Пишем примечание к сделке о том что всё прошло успешно
	create_note($card_id, 'Аннуляция сгенерирована и отправлена в '.$data['dog_naimenovanie_obekta_razmescheniya'], $manager);

	// Создаём задачу на проверку бронирования в квоте человеку, кто отправил аннуляцию
	if(!!$data['kvota'] and $data['status_id'] === 142){
		sendRequestToAmo('POST', "/api/v4/tasks", [
			(object)[
				"responsible_user_id" => (int)$_GET['userid'],
				"entity_id" => (int)$card_id,
				"entity_type" => "leads",
				"text" => 'Не забудь снять бронирование в таблице квот.',
				"complete_till" => time()
			]
		]);
	};
	require_once 'src/success.php';
	printSuccess("Аннуляция сгенерирована и отправлена в ".$data['dog_naimenovanie_obekta_razmescheniya']);

} else {
	create_note($card_id, "Произошла ошибка! Письмо не отправлено! Сгенерируйте аннуляцию в .docx и отправьте письмо вручную.", $manager);	
	require_once 'src/error.php';
	printError("Произошла ошибка! Письмо не отправлено! Попробуйте ещё раз или отправьте аннуляцию вручную.");
	//echo json_encode(['error' => true]);
	//echo 'Произошла ошибка';
};

echo '
<script>
setTimeout(window.close, 5000)
</script>';
exit;
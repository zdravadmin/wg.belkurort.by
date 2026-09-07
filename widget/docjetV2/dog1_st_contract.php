<?php
require_once 'src/autoload.php';

$managerName = getManagerNameWithInitials($data['name_manager']);

$data['stamp'] = 'oval_stamp';
$data['vh_stamp'] = 180;

if($data['sign'] == '3406348') {
	$data['stamp'] = ($buttonType === 'pdf') ? 'round_stamp' : 'null';
	$data['vh_stamp'] = ($buttonType === 'pdf') ? 150 : $data['vh_stamp'];
	$data['sign'] = ($buttonType === 'pdf') ? $data['sign'] : 'null';
}

if($buttonType == 'doc') {
	$data['stamp'] = 'null';
	$data['sign'] = 'null';
}

$isEkvairing = ($data['type_oplaty'] == "Эквайринг");

$docPath = 'templatesV2/dog_template_and_bill.docx';
if($docType == '1') {
	$docPath = 'templatesV2/dog_template_and_bill_tax.docx';
}
if($docType == '1' and $isDogovor2023) {
	$docPath = 'templatesV2/dogovor2023.docx';
}
// if($isEkvairing) {
// 	$docPath = 'templatesV2/dog_template.docx';
// }
if($docType == '6') {
	if($isDogovor2023) {
		printError('C 16.02.2023 мы поменяли форму основного договора. А разработать договор 0,5 пока не успели');
		exit;
	}
	$docPath = 'templatesV2/dog_template_and_bill_prepay.docx';
}
if($docType == '5') {
	$docPath = 'templatesV2/act_template.docx';
}
if($docType == '7') {
	if($isDogovor2023) {
		printError('C 16.02.2023 мы поменяли форму основного договора. А разработать счёт к договору 0,5 пока не успели');
		exit;
	}
	$docPath = 'templatesV2/bill_template_prepay_tax.docx';
}
// if($docType == '7' and !$isWithTax) {
// 	$docPath = 'templatesV2/bill_template_prepay.docx';
// }


$document = new PhpOffice\PhpWord\TemplateProcessor($docPath);
$banket_separate_flag = false;

if(!$isEkvairing and $docType != '6') {
	list($shet, $data['stoimost_sanatoriya'], $data['sum_tax']) = makeBill($pril, $data, $sumtransfer, $valuta, $innerValutesOnDate); //Генерим счёт и считаем стоимость санатория
	$data['cena_uslug'] = costOfServices($data, $sumtransfer); // Считаем стоимость услуг
	$document->cloneRowAndSetValues('tid', $shet); // Заполняем поле со счётом
}

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
$document->setValue('newyear_program', $data['newyear_program']);
$document->setValue('sum_new_year_program', $data['sum_new_year_program']);
$document->setValue('name_manager', $managerName);
$document->setValue('podpis', $data['podpis']);
$document->setValue('dolzhnost', $data['dolzhnost']);
$document->setValue('korschet', $data['korschet']);
$document->setValue('korschet_shet', $data['korschet_shet']);
$document->setValue('covid', $covid);
$document->setValue('rbcovid', setRBcovid($data));
$document->setValue('kurort_sbor', $data['kurort_sbor']);
$document->setValue('salesdetails', $data['prilozhenieUpd'][0]["salesdetails"]);
$document->setValue('oplata_po_schetu', $data['oplata_po_schetu']);
$document->setValue('pay_days', $data['due_days']); 
$document->setValue('pay_hours', $data['due_hours']);

$document->setValue('turobsluzhivanie_tax', getNDSFraza($data['turobsluzhivanie_tax'], $data['valyuta']));
$document->setValue('infouslugi_tax', getNDSFraza($data['infouslugi_tax'], $data['valyuta']));
$document->setValue('stoimost_sanatoriya_tax', getNDSFraza($data['stoimost_sanatoriya_tax'], $data['valyuta']));
$document->setValue('ekvayring_tax', getNDSFraza($data['ekvayring_tax'], $data['valyuta']));

// для счёта
$document->setValue('sum_bez_nds', $data['cena_uslug'] - $data['sum_tax']);
$document->setValue('sum_nds', $data['sum_tax']);

// для договора 0,5
$document->setValue('minus_2_month', $data['data_zaezda_minus_2_month']);
$document->setValue('sum_predopl_fact', $data['sum_predopl_dlya_dogovora']);

// для счёта 0,5
$document->setValue('data_predopl_fact', date("d.m.Y",strtotime($data['data_predopl_fact'])));
$document->setValue('ostatok', $data['cena_uslug']-$data['sum_predopl_fact']);

// для акта
if(in_array($docType, ['5'])) {
	$document->setValue('boss_name', $data['boss_name']);
	$document->setValue('boss_podpis', $data['boss_podpis']);
	$document->setValue('boss_dolzhnost', $data['boss_dolzhnost']);
	$document->setValue('turist_dogovor_fio_header', $data['turist_dogovor_fio_header']);
	$format = new NumberFormatter("ru", NumberFormatter::SPELLOUT);
	$document->setValue('cena_uslug_propis', $format->format($data['cena_uslug']));
}

$document->setImageValue('sign', array('path' => 'sign/'.$data['sign'].'.png', 'width' => 150, 'height' => 150, 'ratio' => true));
$document->setImageValue('stamp', array('path' => 'sign/'.$data['stamp'].'.png', 'width' => $data['vh_stamp'], 'height' => $data['vh_stamp'], 'ratio' => true));

if(!in_array($docType, ['7', '5'])) {
	$document->cloneRowAndSetValues('prilozhenie', $data['prilozhenieUpd']);
}

if($docType == '1' and $isDogovor2023) {
	$serviceListWithPrice = service_list($data, true);
	$document->cloneRowAndSetValues('serviceListWithPrice', $serviceListWithPrice);
	$serviceListWithoutPrice = service_list($data, false);
	$document->cloneRowAndSetValues('serviceListWithoutPrice', $serviceListWithoutPrice);
}

$fio = explode(",",$data['turist_dogovor_fio_pasport_propiska']);

$name_doc_type = ($docType == 7) ? 'Cчет' : 'Договор';

if($buttonType === 'doc') {	
	$date = date('d-m-Y');
	$time = date('H:i:s');
	$path = "wievDoc/".$date.' '.$time.' '.$name_doc_type.' '.explode(" ",$fio[0])[0].'.docx';
	ob_clean();
	$document ->saveAs($path);

	require_once 'yaDiskFunc.php';
	saveFileToYaDisk('leads', $card_id, '/Генерация', $path);

			header("Content-Type: text/html; charset=utf-8");
			header('Content-Description: File Transfer');
			header('Content-Type: application/octet-stream');
			header('Content-Disposition: attachment; filename='.$name_doc_type.' '.explode(" ",$fio[0])[0].'.docx');
			header('Content-Transfer-Encoding: binary');
			header('Expires: 0');
			header('Cache-Control: must-revalidate');
			header('Pragma: public');
			header('Content-Length: ' . filesize($path));
			flush();
			readfile($path);
} else if($buttonType === 'pdf') {
	$date = date('d-m-Y');
	$time = date('H:i:s');
	ob_clean();
	$docfilename = "wievDoc/".$date.' '.$time.' '.$name_doc_type.' '.explode(" ",$fio[0])[0].'.docx';
	$document ->saveAs($docfilename);

	//Генерим pdf
	require_once 'pdf_function.php';
	$pdfUrl = getPdfUrl($docfilename);
	$pdfUrl = preg_replace("/ /","%20",$pdfUrl);

	require_once 'yaDiskFunc.php';
	saveFileByLinkOnYaDisk( $pdfUrl, 
													'leads', 
													$card_id, 
													$name_doc_type.' '.explode(" ",$fio[0])[0].' '.$time.' '.$date.'.pdf', 
													'/Генерация');
	flush();
	header ('Location: '.$pdfUrl);
} else {
	$timestamp = strtotime("now");
	$docname = "wievDoc/".$timestamp.$name_doc_type.'.docx';

	if (file_exists($docname)) {
			unlink($docname);
	}
	ob_clean();
	$document->saveAs($docname);
	flush();
	header('Location: https://view.officeapps.live.com/op/view.aspx?src='.urlencode('http://wg.belkurort.by/widget/docjetV2/'.$docname));
	flush();
}

function getManagerNameWithInitials($name) {
	$array = explode(" ", $name);
	$managerName = $array[0]." ".substr($array[1], 0, 2);
	if(isset($array[2])) {
			$managerName = $managerName.". ".substr($array[2], 0, 2).".";
	}
	return $managerName;
}

function makeBill($pril, $data, $sumtransfer, $valuta, $innerValutesOnDate) {
	global $tax;
	global $banket_separate_flag;
	$shet = [];
	$stoimostSan = $data['stoimost_sanatoriya'];
	$data['sum_tax'] = 0;

	if($pril["is_all_price_not_null"]) {
		$innerValutesOnDate = getInnerCursesFromDB($data['data_dogovora']);		
		$stoimostSan = 0;

		foreach($pril['going'] as $guest) {
			$tsum = converterValut($guest["price"], $guest["valuta_price"], $valuta, $innerValutesOnDate);
			$stoimostSan = $stoimostSan + $tsum;
			$checkin = (isset($guest["guestcheckin"])) ? $guest["guestcheckin"] : date("d.m.Y",strtotime($data['data_zaezda']));
			$checkout = (isset($guest["guestcheckout"])) ? $guest["guestcheckout"] : date("d.m.Y",strtotime($data['data_vyezda']));

			array_push($shet,
				array(
					'tid'        => count($shet)+1, //$guest["id"],
					'tusl' => mb_strtoupper(mb_substr($data['dog_s_lecheniem'], 0, 1, 'UTF-8'), 'UTF-8').mb_substr($data['dog_s_lecheniem'], 1, null,'UTF-8').' в соответствии с программой туристического путешествия в '.$data['dog_naimenovanie_obekta_razmescheniya'].' (Республика Беларусь) с '.$checkin.' по '.$checkout.' для гостя '.$guest['just_fio'],
					'ted_izm'      => 'шт.',
					'tkol_vo'     => '1',
					'stavka_nds' => 'Без НДС',
					'summa_nds' => '0,00',
					'tcost'     => $tsum,
					'tsum'     => $tsum,
				));

			if($data['sum_novogod_banketa'] != 0 and $guest["banket_price"] > 0) {
				$banket_price = converterValut($guest["banket_price"], $guest["banket_cur"], $valuta, $innerValutesOnDate);
				$stoimostSan = $stoimostSan + $banket_price;
				$banket_separate_flag = true;
				
				$summa_nds = round(($banket_price * $tax['sum_novogod_banketa'] / (1+$tax['sum_novogod_banketa'])), 2);
				$data['sum_tax'] += $summa_nds;

				array_push($shet,
					array(
						'tid'        => count($shet)+1,
						'tusl' => 'Новогодний банкет в '.$data['dog_naimenovanie_obekta_razmescheniya'].' для гостя '.$guest['just_fio'],
						'ted_izm'      => 'шт.',
						'tkol_vo'     => '1',
						'stavka_nds' => ($tax['sum_novogod_banketa']*100).'%',
						'summa_nds' => $summa_nds,
						'tcost'     => $banket_price - $summa_nds,
						'tsum'     => $banket_price,
				));
			}
		}
	} else {
		$shet = array(
			array(
				'tid'        => 1,
				'tusl' => mb_strtoupper(mb_substr($data['dog_s_lecheniem'], 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($data['dog_s_lecheniem'], 1, null,'UTF-8').' в соответствии с программой туристического путешествия в '.$data['dog_naimenovanie_obekta_razmescheniya'].' с '.date("d.m.Y",strtotime($data['data_zaezda'])).' по '.date("d.m.Y",strtotime($data['data_vyezda'])).' для '.$data['kolichestvo_turistov'].' человек(-а)',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => 'Без НДС',
				'summa_nds' => $data['stoimost_sanatoriya_tax'],
				'tcost'     => $data['stoimost_sanatoriya'],
				'tsum'     => $data['stoimost_sanatoriya'],
			)
		);
	}

	if($data['turobsluzhivanie'] != 0) {
		$summa_nds = $data['turobsluzhivanie_tax'];
		$data['sum_tax'] += $summa_nds;
		array_push($shet, array(
				'tid' => (count($shet)+1),
				'tusl' => 'Организация комплексного туристического обслуживания',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => ($tax['turobsluzhivanie']*100).'%',
				'summa_nds' => $summa_nds,
				'tcost'     => $data['turobsluzhivanie'] - $summa_nds,
				'tsum'     => $data['turobsluzhivanie']
		));
	};

	if($data['infouslugi'] != 0) {
		$summa_nds = $data['infouslugi_tax'];
		$data['sum_tax'] += $summa_nds;
		array_push($shet, array(
				'tid' => (count($shet)+1),
				'tusl' => 'Туристические информационные услуги',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => ($tax['infouslugi']*100).'%',
				'summa_nds' => $summa_nds,
				'tcost'     => $data['infouslugi'] - $summa_nds,
				'tsum'     => $data['infouslugi']
		));
	};

	if($sumtransfer != 0) {
		$summa_nds = $data['sumtransfer_tax'];
		$data['sum_tax'] += $summa_nds;
		array_push($shet, array(
				'tid' => (count($shet)+1),
				'tusl' => 'Организация перевозки туристов автомобильным транспортом (трансфер)',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => ($tax['transfer']*100).'%',
				'summa_nds' => $summa_nds,
				'tcost'     => $sumtransfer - $summa_nds,
				'tsum'     => $sumtransfer
		));
	};

	if($data['sum_novogod_banketa'] > 0 and $banket_separate_flag == false) {
		$summa_nds = $data['sum_novogod_banketa_tax'];
		$data['sum_tax'] += $summa_nds;
		array_push($shet, array(
				'tid' => (count($shet)+1),
				'tusl' => 'Организация новогоднего банкета',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => ($tax['sum_novogod_banketa']*100).'%',
				'summa_nds' => $summa_nds,
				'tcost'     => $data['sum_novogod_banketa'] - $summa_nds,
				'tsum'     => $data['sum_novogod_banketa']
		));
	};

	if($data['sum_novogod_program'] != 0) {
		$summa_nds = $data['sum_novogod_program_tax'];
		$data['sum_tax'] += $summa_nds;
		array_push($shet, array(
				'tid' => (count($shet)+1),
				'tusl' => 'Организация новогодней программы',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => ($tax['sum_novogod_program']*100).'%',
				'summa_nds' => $summa_nds,
				'tcost'     => $data['sum_novogod_program'] - $summa_nds,
				'tsum'     => $data['sum_novogod_program']
		));
	};

	if($data['sum_novogod_utrennika'] != 0) {
		$summa_nds = $data['sum_novogod_utrennika_tax'];
		$data['sum_tax'] += $summa_nds;
		array_push($shet, array(
				'tid' => (count($shet)+1),
				'tusl' => 'Организация детского новогоднего утренника',
				'ted_izm'      => 'шт.',
				'tkol_vo'     => '1',
				'stavka_nds' => ($tax['sum_novogod_utrennika']*100).'%',
				'summa_nds' => $summa_nds,
				'tcost'     => $data['sum_novogod_utrennika'] - $summa_nds,
				'tsum'     => $data['sum_novogod_utrennika']
		));
	};

	return array($shet, $stoimostSan, $data['sum_tax']);
}

function costOfServices($data, $sumtransfer) {
	global $banket_separate_flag;
	$cost = $data['stoimost_sanatoriya'] + $data['infouslugi'] + $data['turobsluzhivanie'] + $sumtransfer + $data['sum_novogod_program'] + $data['sum_novogod_utrennika'];
	if(!$banket_separate_flag) {
		$cost += $data['sum_novogod_banketa'];
	}
	return $cost;
}

function setRBcovid($data) {
	return ($data['san_country'] == "РБ" and $data["not_rb"]) 
		? ", а также доведены нормы Постановления Совета министров РБ от 25.03.2020 №171 «О мерах по предотвращению завоза и распространения инфекции, вызванной коронавирусом COVID-19»"
		: "";
}
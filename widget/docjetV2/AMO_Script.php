<?php
header('Content-Type: text/html; charset=utf-8');

if (isset($_GET['card_id']) && isset($_GET['card_type']) && isset($_GET['doc']) && $_GET['card_type'] == 'lead') {
	//подключаем БД, стандартные функции
	// require_once("../../db_login.php");
	require_once "../../auth.php";
	require_once("../../functions.php");
	cors();
	require_once("../convertValutFunction.php");
	
	$card_id = preg_replace("/[^0-9]/", '', $_GET['card_id']);
	$card_type = addslashes($_GET['card_type']);
  	$doc = addslashes($_GET['doc']);
	$docType = addslashes($_GET['docType']);
	$buttonType = addslashes($_GET['buttonType']);

	require_once("controllers/amocrm.php");

	$lead = getLead($card_id);

	$manager = (isset($_GET['userid'])) ? $_GET['userid'] : $lead['responsible_user_id'];

	// Проверяем наличие файла подписи. Если его нет - генерим от имени руководителя
	if(!file_exists('sign/'.$manager.'.png')) {
		$manager = '3406348';
	}

	require_once("controllers/dataArr.php");
	$data = makeData($lead);

	if(	strtotime($data['data_zaezda']) <= time() and 
		in_array($docType, [1, 6, 7, 2, 9, 0]) and
		$lead['status_id'] !== 142) {
		require_once './src/error.php';
		printError('Дата заезда должна быть позже чем сегодня');
		exit;
	}

	if(	date('Y', strtotime($data['data_dogovora'])) != date('Y') && 
		in_array($docType, [1, 6, 7, 2, 9, 0]) && 
		$lead['status_id'] !== 142) {
		require_once './src/error.php';
		printError('Дата договора должна быть в этом году');
		exit;
	}

	// Если квота и попытка отправить заявку / корректировку / аннуляцию и статус сделки не 142 - выбрасываем ошибку
	if(	!!$data['kvota'] && 
		in_array($docType, [0, 9, 2]) && 
		$buttonType === 'send' && 
		$lead['status_id'] !== 142 &&
		!in_array($card_id, [ 26298006, 26177296, 26183538, 26183056, 26239598, 26231148, 26505498, 26618576 ]) &&
		!in_array($_GET['userid'],['3406348'])) {
		require_once './src/error.php';
		printError('Заявки по квотам можно отправить только после продажи');
		exit;
	}

	$isOpenBookAfterSeptember = false;

	$isOpenBookAfterSeptemberSending = false;

	// вычисляем количество дней и часов для оплаты
	$data['due_days'] = getWorkDays($data['hypot_date_pay']);
	$data['due_days'] = $data['due_days'] <= 3 ? $data['due_days'] : 3;
	// Если дата договора среда, а заезд в ближайшие выходные или понедельник, то даём 2 дня на оплату
	$data['due_days'] = isNeedChangeDueDays($data['data_dogovora'], $data['data_zaezda']) ? 2 : $data['due_days'];
	$data['due_hours'] = $data['due_days']*24;

	if(in_array($card_id, [	27223790, 27285018 ])) {
		$data['due_days'] = 1;
		$data['due_hours'] = 24;
	}

	if(in_array($card_id, [27039286])) {
		$data['due_days'] = 1;
		$data['due_hours'] = 20;
	}

	if(in_array($card_id, [27316094])) {
		$data['due_days'] = 1;
		$data['due_hours'] = 6;
	}

	//вычитаем 2 месяца для половинчатого договора
	$data['data_zaezda_minus_2_month'] = new DateTime($data['data_zaezda']);
	$data['data_zaezda_minus_2_month']->modify('-1 month');
	$data['data_zaezda_minus_2_month'] = $data['data_zaezda_minus_2_month']->format('d.m.Y');

	//Получаем информацию по манагеру
	$stmt = $db->query('SELECT name, phone, fio_v_rod_pad, dolzhnost, dolzhnost_v_rod_pad FROM users where id ='.$manager);
	$managerinfo = $stmt->fetchAll();

    // Ищем доверенность менеджера, действующую на дату договора
    $dateDogovoraSql = date('Y-m-d', strtotime($data['data_dogovora']));
    $stmt2 = $db->query('SELECT
                            CASE WHEN sub_number = 0
                                THEN number
                                ELSE CONCAT(number, "/", sub_number)
                            END as num_doverki,
                            DATE_FORMAT(date_start,"%d.%m.%Y") as date_doverki
                        FROM powers_of_attorney
                        WHERE number != 0
                            and date_start <= "'.$dateDogovoraSql.'"
                            and (date_end IS NULL or date_end >= "'.$dateDogovoraSql.'")
                            and amo_user_id ='.$manager.'
                        ORDER BY date_start DESC
                        LIMIT 1');
    $poa = $stmt2->fetchAll();

    if (date('Y.m.d') >= '2026.07.10' && date('Y.m.d') <= '2026.07.15') {
		$data['boss_name'] = 'Пулинович В.В.';
		$data['boss_podpis'] = 'заместителя директора Пулиновича Василия Васильевича, действующего на основании доверенности №214/1 от 03.06.2026';
		$data['boss_dolzhnost'] = 'Заместитель директора ООО "Здравкурорт"';

		$data['name_manager'] = 'Пулинович Василий Васильевич';
		$data['phone_manager'] = '+375291956006';
		$data['podpis'] = 'заместителя директора Пулиновича Василия Васильевича, действующего на основании доверенности №214/1 от 03.06.2026';
		$data['dolzhnost'] = 'Заместитель директора ООО "Здравкурорт';
		$data['sign'] = '3563083';
	} else if (date('Y.m.d') >= '2026.07.01' && date('Y.m.d') <= '2026.07.09') {
		$data['boss_name'] = 'Залевская М.Л.';
		$data['boss_podpis'] = 'заместителя директора по развитию Залевскую Марину Леонидовну, действующего на основании доверенности №218 от 30.06.2026';
		$data['boss_dolzhnost'] = 'Заместитель директора по развитию';

		$data['name_manager'] = 'Залевская Марина Леонидовна';
		$data['phone_manager'] = '+375447969372';
		$data['podpis'] = 'заместителя директора по развитию Залевской Марины Леонидовны, действующего на основании доверенности №218 от 30.06.2026';
		$data['dolzhnost'] = 'Заместитель директора по развитию';
		$data['sign'] = '12485533';
	} else {
		$data['boss_name'] = 'Свиридович Г.А.';
		$data['boss_podpis'] = 'директора Свиридовича Григория Александровича, действующего на основании Устава';
		$data['boss_dolzhnost'] = 'Директор';

		$data['name_manager'] = 'Свиридович Григорий Александрович';
		$data['phone_manager'] = '+375291956006';
		$data['podpis'] = 'директора Свиридовича Григория Александровича, действующего на основании Устава';
		$data['dolzhnost'] = "Директор";
		$data['sign'] = '3406348';
	}


	if(isset($poa[0])) {
		if($poa[0]["num_doverki"] != 0) {
			$dolzhnost_v_rod_pad = ($managerinfo[0]["dolzhnost_v_rod_pad"] == "") ? "cпециалиста" : $managerinfo[0]["dolzhnost_v_rod_pad"];
			$data['podpis'] = $dolzhnost_v_rod_pad.' '.$managerinfo[0]["fio_v_rod_pad"].', действующего на основании доверенности №'.$poa[0]["num_doverki"].' от '.$poa[0]["date_doverki"];
			$data['dolzhnost'] = ($managerinfo[0]["dolzhnost"] == "") ? "Специалист" : $managerinfo[0]["dolzhnost"];
			$data['sign'] = $manager;
            $data['name_manager'] = $managerinfo[0]['name'];
            $data['phone_manager'] = $managerinfo[0]['phone'];
		}
	}

	//Получаем информацию по санаторию
	$data['kurort_sbor'] = 'в цену туристических услуг не входит и в месте размещения самостоятельно уплачивается Заказчиком курортный сбор (статьи 313-319 Налогового кодекса Республики Беларусь), если он установлен в районе (населённом пункте), в котором находится место оказания туристических услуг.';
	$stmt = $db->query('SELECT * FROM foundation where id ='.$data["sanid"]);
	$infoaboutsan = $stmt->fetchAll();

	if($data["sanid"] == 531911) {
		$data['kurort_sbor'] = '';
	};

	$data['dog_naimenovanie_obekta_razmescheniya'] = $infoaboutsan[0]["type"]." '".$infoaboutsan[0]["name"]."'";
	$data['dog_adres_obekta_razmescheniya'] = $infoaboutsan[0]["address"];
	$data['dog_chasy_zaezda_vyezda'] = $infoaboutsan[0]["timeinandout"];

	if($data["sanid"] == 448619 and strtotime($data['data_zaezda']) > 1640984400) {
		$data['dog_chasy_zaezda_vyezda'] = "заезд в первый день путёвки с 12:00, выезд в последний день путёвки до 10:00";
	}

	if($data["sanid"] == 464911 and strtotime($data['data_zaezda']) > 1641589200) {
		$data['dog_chasy_zaezda_vyezda'] = "заезд с 8:00 первого дня путевки (первая услуга «завтрак»), выезд до 06:00 последнего дня путевки (последняя услуга «ужин» накануне дня выезда)";
	}

	if($data["sanid"] == 465157 and strtotime($data['data_zaezda']) > 1704067200) {
		$data['dog_chasy_zaezda_vyezda'] = "заезд в первый день путёвки с 12:00, выезд в последний день путёвки до 10:00";
	}

	if($data["sanid"] == 437471 and strtotime($data['data_zaezda']) < 1706745600) {
		$data['dog_chasy_zaezda_vyezda'] = "заезд в первый день путёвки с: 08:00, выезд в последний день путёвки до: 20:00";
	}

	// Если радуга и меньше чем на 3 дня, то генерируем дежурное меню
	$isRadugaOn2Days = (($data["sanid"] == 454305) and ((strtotime($data['data_vyezda']) - strtotime($data['data_zaezda'])) < 259200));
	if($isRadugaOn2Days) {
		$data['pitanie'] = 'Дежурное меню';
	}

	$data['email'] = $infoaboutsan[0]["email"];
	$data['sutki_dni'] = $infoaboutsan[0]["dayorsut"];
	$data['san_country'] = $infoaboutsan[0]["country"];

	$data['rb_spravka_covid'] = strtotime($data['data_zaezda']) > 1661979600 ? $infoaboutsan[0]["rb_spravka_covid"] : '';
	$data['rf_spravka_covid'] = strtotime($data['data_zaezda']) > 1661979600 ? $infoaboutsan[0]["rf_spravka_covid"] : '';
	$data['rf_test_covid'] = strtotime($data['data_zaezda']) > 1661979600 ? $infoaboutsan[0]["rf_test_covid"] : '';
	$data['rb_test_covid'] = strtotime($data['data_zaezda']) > 1661979600 ? $infoaboutsan[0]["rb_test_covid"] : '';

	$data['rf_test_covid'] = (in_array($data["sanid"], [448583, 448613, 448611, 448607, 478371, 785980])) ? $infoaboutsan[0]["rf_test_covid"] : $data["rf_test_covid"];

	$idtouroperator = findcustomfieldvalid($lead, 339925);

	if($idtouroperator != 493013 and $idtouroperator != null) {
		$stmt = $db->query('SELECT * FROM touroperators where id ='.$idtouroperator);
		$data['email'] = $stmt->fetchAll()[0]["email"];
	}
 
	if(findcustomfieldvalid($lead, 305179) == 437579) {
		$data['dog_s_lecheniem'] = "организация оздоровительных мероприятий, размещения и питания туристов";
		$data['dog_lechenie'] = "3.	Лечение";
	} else {
		$data['dog_s_lecheniem'] = "организация размещения и питания туристов";
		$data['dog_lechenie'] = "";
	}

	$sumtransfer = findcustomfieldval($lead,305137);

	//конвертируем цены в валюту договора
	
	$currency = getCursFromNBRB($data['data_dogovora']);
	$valuta = "RUB";
	$data['korschet'] = ""; 
	$data['korschet_shet'] = "";
	//задаём номер счёта исходя из валюты
	if(stripos($data['valyuta'], "бел") !== false) {
		$valuta = "BYN";
	} else if(stripos($data['valyuta'], "США") !== false) {
		$valuta = "USD";
	} else if(stripos($data['valyuta'], "евро") !== false) {
		$valuta = "EUR";
	}

	/*
	Заявки РФ по санаториям
	Радон, Поречье, Сосновый бор, 
	Рассвет-любань, Ружанский, Веста, 
	Машиностроитель, Энергетик гродно, Берестье, 
	Боровое
	уйдут завтра
	*/
	$stmt = $db->query('SELECT * FROM `not_send` WHERE `date` = CURDATE()');
	$hasNotSendDates = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	$notSend = (in_array($data['sanid'], [	448583, 448613, 448611, 448607, 
											469593, 450649, 
											453229, 454245, 465157, 
											458451]) 
							// and !in_array($card_id, [ 	26260828, 16627190, 26063178, 
							// 							26296100, 26377798, 26377580, 
							// 							26196806, 25993374, 26506884, 26489448,
							// 							26577750 ])
							and count($hasNotSendDates) > 0
							and $valuta == "RUB"
							and !in_array($_GET['userid'],['3504832', '3406348']));

	//если надо - меняем цены в договоре на валютные
	if($valuta != "RUB") {
		$data['stoimost_sanatoriya'] = convert($data['stoimost_sanatoriya'], $valuta);
		$data['infouslugi'] = convert($data['infouslugi'], $valuta);
		$data['turobsluzhivanie'] = convert($data['turobsluzhivanie'], $valuta);
		$sumtransfer = convert($sumtransfer, $valuta);
		$data['sum_novogod_banketa'] = convert($data['sum_novogod_banketa'], $valuta);
		$data['sum_novogod_program'] = convert($data['sum_novogod_program'], $valuta);
		$data['sum_novogod_utrennika'] = convert($data['sum_novogod_utrennika'], $valuta);
		//$data['cena_uslug'] = convert($data['cena_uslug'],$valuta);
		$data['cena_uslug'] = $data['stoimost_sanatoriya'] + $data['infouslugi'] + $data['turobsluzhivanie'] + $sumtransfer + $data['sum_novogod_banketa'] + $data['sum_novogod_utrennika'] + $data['sum_novogod_program'];
		$data['ekvayring'] = convert($data['ekvayring'], $valuta);
		$data['sum_predopl_fact'] = convert($data['sum_predopl_fact'], $valuta);
		$data['sum_predopl_dlya_dogovora'] = convert($data['sum_predopl_dlya_dogovora'], $valuta);
		$data['sum_all_pay_fact'] = convert($data['sum_all_pay_fact'], $valuta);
	}

	$isDogovor2023 = strtotime($data['data_dogovora']) >= 1676476800;

	// Просчёт НДС
	$isWithTax = true;

	$tax = ['stoimost_sanatoriya' => null, 
					'infouslugi' => 20/100, 
					'turobsluzhivanie' => 20/100,
					'transfer' => 20/100,
					'sum_novogod_banketa' => 20/100,
					'sum_novogod_program' => 20/100,
					'sum_novogod_utrennika' => 20/100,
					'ekvayring' => 20/100];

	if($isWithTax) {
		$data['stoimost_sanatoriya_tax'] = ($tax['stoimost_sanatoriya'] == null) ? null : round(($data['stoimost_sanatoriya'] * $tax['stoimost_sanatoriya'] / (1+$tax['stoimost_sanatoriya'])), 2);
		$data['infouslugi_tax'] = round(($data['infouslugi'] * $tax['infouslugi'] / (1+$tax['infouslugi'])), 2);
		$data['turobsluzhivanie_tax'] = round(($data['turobsluzhivanie'] * $tax['turobsluzhivanie'] / (1+$tax['turobsluzhivanie'])), 2);
		$data['sumtransfer_tax'] = round(($sumtransfer * $tax['transfer'] / (1+$tax['transfer'])), 2);
		$data['sum_novogod_banketa_tax'] = round(($data['sum_novogod_banketa'] * $tax['sum_novogod_banketa'] / (1+$tax['sum_novogod_banketa'])), 2);
		$data['sum_novogod_program_tax'] = round(($data['sum_novogod_program'] * $tax['sum_novogod_program'] / (1+$tax['sum_novogod_program'])), 2);
		$data['sum_novogod_utrennika_tax'] = round(($data['sum_novogod_utrennika'] * $tax['sum_novogod_utrennika'] / (1+$tax['sum_novogod_utrennika'])), 2);
		$data['ekvayring_tax'] = round(($data['ekvayring'] * $tax['ekvayring'] / (1+$tax['ekvayring'])), 2);
		
		$data['sum_tax'] = 	$data['stoimost_sanatoriya_tax'] + 
												$data['infouslugi_tax'] + 
												$data['turobsluzhivanie_tax'] + 
												$data['sumtransfer_tax'] + 
												$data['sum_novogod_banketa_tax'] + 
												$data['sum_novogod_program_tax'] + 
												$data['sum_novogod_utrennika_tax'];
	}

	if($sumtransfer > 0) {
		$data['dog_transfer_fraza'] = " организация перевозки туристов автомобильным транспортом (трансфер) - ".$sumtransfer." ".$data['valyuta'].
		getNDSFraza($data['sumtransfer_tax'], $data['valyuta']).";";
		$data['dog_transfer_fraza_2'] = "организация перевозки туристов автомобильным транспортом (трансфер);";
		$data['dog_transfer'] = "Да";
	} else {
		$data['dog_transfer_fraza'] = "";
		$data['dog_transfer_fraza_2'] = "";
		$data['dog_transfer'] = "не требуется";
	}

//определяем, заполнен ли турист 1 и получаем приложение к договору
	// if(!isset($data['turist_dogovor_fio_pasport_propiska'])) {
		$pril = getPrilozhenieDB($card_id, $data['data_zaezda'], $data['data_vyezda']);
		$data['dog_chasy_zaezda_vyezda'] = ($pril['specifictimeinandout'] == '') ? $data['dog_chasy_zaezda_vyezda'] : $pril['specifictimeinandout'];
		$data['prilozhenie'] = $pril["going"];
		$data['not_rb'] = $pril["not_rb"];
		$data['prilozhenieUpd'] = getPrilozhenieUpdDB($data['prilozhenie'], $sumtransfer, $data['data_zaezda'], $data['data_vyezda']);
		$data['turist_dogovor_fio_pasport_propiska'] = (isset($pril['not_going'][0]['fio'])) ? $pril['not_going'][0]['fio'] : $pril['going'][0]['fio'];
		$data['dog_edet_li_turist_dogovor'] = $data['prilozhenie'][0]['fio'];
		$data['tip_nomera'] = $pril['tip_nomera'];

	if($pril['kolichestvo_turistov'] > 0) {
		$data['kolichestvo_turistov'] = $pril['kolichestvo_turistov'];
	} else if(count($data['prilozhenie']) > 0) {
		$data['kolichestvo_turistov'] = count($data['prilozhenie']);
	}

	// $data['kolichestvo_turistov'] = (isset($pril['kolichestvo_turistov']) and $pril['kolichestvo_turistov'] > 0) ? $pril['kolichestvo_turistov'] : (count($data['prilozhenie']) > 0) ? count($data['prilozhenie']) : $data['kolichestvo_turistov'];

$data = setCountDays($data);

$data['turist_dogovor_fio_pasport_propiska_short'] = $data['turist_dogovor_fio_pasport_propiska'];

// Если задана компания - составляем договор на компанию
$stmt = $db->query('SELECT 
					companies.companyName as companyName,
					companies.represented as represented,
					companies.basis as basis,
					companies.address as address,
					companies.addressPost as addressPost,
					companies.checkingAcc as checkingAcc,
					companies.bankCode as bankCode,
					companies.korrSchet as korrSchet,
					companies.bankAddress as bankAddress,
					companies.unp as unp,
					companies.phone as phone
					FROM companies_to_leads
					INNER JOIN companies ON companies.id = companies_to_leads.company_id
					WHERE companies_to_leads.lead_id = '.$card_id.'
					LIMIT 1');
$company = $stmt->fetchAll();

if(count($company) != 0) {
	$company = $company[0];
	$data['turist_dogovor_fio_pasport_propiska'] = $company['companyName'].' в лице '.$company['represented'];
	$data['turist_dogovor_fio_pasport_propiska'] = ($company['basis'] != "") ? $data['turist_dogovor_fio_pasport_propiska'].', действующего на основании '.$company['basis'] : $data['turist_dogovor_fio_pasport_propiska'];
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].' </w:t><w:br/><w:t>'.$company['unp'];
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['address'], 'Юридический адрес');
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['addressPost'], 'Почтовый адрес');
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['phone'], 'Телефон организации');
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['checkingAcc'], 'Расчётный счёт');
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['bankCode'], 'Код банка');
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['korrSchet'], 'Корр. счёт');
	$data['turist_dogovor_fio_pasport_propiska'] = $data['turist_dogovor_fio_pasport_propiska'].checkField($company['bankAddress'], 'Адрес банка');
	$data['turist_dogovor_fio_pasport_propiska_short'] = $company['companyName'];
	$data['turist_dogovor_fio_header'] = $company['companyName'].' в лице '.$company['represented'];
	$data['turist_dogovor_fio_header'] = ($company['basis'] != "") ? $data['turist_dogovor_fio_header'].', действующего на основании '.$company['basis'] : $data['turist_dogovor_fio_header'];
}

//чекаем новогодний банкет
$data['newyear'] = (findcustomfieldval($lead, 762124) == "Входит в стоимость санатория" || ((int)findcustomfieldval($lead,362303)) != 0) ? "
</w:t><w:br/><w:t>организация новогоднего банкета;" : "";
$data['sum_new_year'] = (((int)findcustomfieldval($lead,362303)) != 0) ? "
</w:t><w:br/><w:t>организация новогоднего банкета - ".$data['sum_novogod_banketa']." ".$data['valyuta'].
getNDSFraza($data['sum_novogod_banketa_tax'], $data['valyuta']).";" : "";

$data['newyear_program'] = (findcustomfieldval($lead,758042) != 0) ? "
</w:t><w:br/><w:t>организация новогодней программы;" : "";
$data['sum_new_year_program'] = (((int)findcustomfieldval($lead,758042)) != 0) ? "
</w:t><w:br/><w:t>организация новогодней программы - ".$data['sum_novogod_program']." ".$data['valyuta'].
getNDSFraza($data['sum_novogod_program_tax'], $data['valyuta']).";" : "";

$data['new_year_utrennik'] = (((int)findcustomfieldval($lead,396460)) != 0) ? "
</w:t><w:br/><w:t>организация детского новогоднего утренника" : ""; 
$data['sum_new_year_utrennik'] = (((int)findcustomfieldval($lead,396460)) != 0) ? "
</w:t><w:br/><w:t>организация детского новогоднего утренника - ".$data['sum_novogod_utrennika']." ".$data['valyuta'].
getNDSFraza($data['sum_novogod_utrennika_tax'], $data['valyuta']).";" : "";

require_once("controllers/getRequestNumber.php");
list($data['numrequest'], $data['notSameBookDetails']) = getRequestNumber($docType, $data, $buttonType, $manager);

require_once("controllers/getDocNumber.php");
$data['nomer_dogovora'] = getContractNumber($docType, $data, $buttonType);

if(stripos($data['valyuta'], "бел") !== false) {
	$data['dog_schet'] = "BY95BPSB30123099770109330000";
	$data['oplata_po_schetu'] = 'Оплата по счёту '.$data['nomer_dogovora'].' от '.date('d.m.Y', strtotime($data['data_dogovora']));
} else if(stripos($data['valyuta'], "США") !== false) {
	$data['dog_schet'] = "BY92BPSB30123099770238400000";
	$data['oplata_po_schetu'] = 'Payment by account No. '.$data['nomer_dogovora'].' dated '.date('d.m.Y', strtotime($data['data_dogovora'])).' for crediting to the account of LLC "Zdravkurort", Minsk BY92 BPSB 3012 3099 7702 3840 0000, BPSBBY2X';
} else if(stripos($data['valyuta'], "евро") !== false) {
	$data['dog_schet'] = "BY22BPSB30123099770369780000";
	$data['oplata_po_schetu'] = 'Payment by account No. '.$data['nomer_dogovora'].' dated '.date('d.m.Y', strtotime($data['data_dogovora'])).' for crediting to the account of LLC "Zdravkurort", Minsk BY22 BPSB 3012 3099 7703 6978 0000, BPSBBY2X';
} else {
	$data['dog_schet'] = "BY43BPSB30123099770496430000";
	$data['oplata_po_schetu'] = 'Оплата по счёту № '.$data['nomer_dogovora'].' от '.date('d.m.Y', strtotime($data['data_dogovora'])).' для зачисления на счёт ООО "Здравкурорт", г. Минск,  р/с BY43 BPSB 3012 3099 7704 9643 0000, БИК BPSBBY2X';
	$data['korschet'] = "Банк-корреспондент (Beneficiary bank) ПАО Сбербанк, г.Москва</w:t><w:br/><w:t>
ИНН  банка-корреспондента 7707083893</w:t><w:br/><w:t>
к/с 3010 1810 4000 0000 0225</w:t><w:br/><w:t>
БИК банка-корреспондента 044525225 </w:t><w:br/><w:t>
СЧЕТ ПОЛУЧАТЕЛЯ 3011 1810 1000 0000 0090";
	$data['korschet_shet'] = "Корр. счёт для оплаты в российских рублях: 3011 1810 1000 0000 0090";
}
	
//Если стоит галочка квота, то пишем что номер "Из  нашей квоты", если нет, пишем что "Под запрос"
if($data['kvota'] != false) {
	$data['mail_note'] = $data['mail_note']." 
	НОМЕР ИЗ НАШЕЙ КВОТЫ";
	$data['book_type'] = "НОМЕР ИЗ НАШЕЙ КВОТЫ";
} else {
	$data['mail_note'] = $data['mail_note']." 
	Номер под запрос";
	$data['book_type'] = "НОМЕР ПОД ЗАПРОС";
}

// Получаем короткое имя менеджера
$data['short_name_manager'] = getShortName($data['name_manager']);

// Добавляем про covid
if($data['rf_spravka_covid'] or 
		isset($data['rf_test_covid']) or 
		!$data["not_rb"] or 
		$data['rb_spravka_covid'] or 
		isset($data['rb_test_covid'])) {
	$covid = '';
	
	if($data['rf_spravka_covid'] or $data['rf_test_covid']) {
		$covid .= 'а также, при наличии требований действующих нормативно-правовых актов РБ и (или) правил заезда и пребывания в санатории, '.$data['rf_spravka_covid'];
		
		if(isset($data['rf_test_covid'])) {
			$covid .= " ".$data['rf_test_covid'];
		}
	}

	if(!$data["not_rb"]) {
		$covid .= $data['rb_spravka_covid'];
		if(isset($data['rb_test_covid'])) {
			$covid .= " ".$data['rb_test_covid'];
		}
	}
}



//посылаем данные на печать

			   if (!empty($data)) { 
						include_once($doc.'.php');
			   }

			
} else {
            echo "<h2>Для формирования документа выберите сделку</h2>";
}

function getLead2($card_id) {
	try{
		$lead = getLead($card_id);
	} catch (Exception $e) {
		$lead = getLead($card_id);
	}
}


function setCountDays($data) {
	if($data["sanid"] == 448607 and isAllActiveGuestsHaveThisHealth($data['prilozhenie'], "Тур выходного дня")) {
		$data['sutki_dni'] = "суток";
	}

	if($data["sanid"] == 448611 and isAllActiveGuestsHaveThisHealth($data['prilozhenie'], "Путёвка выходного дня")) {
		$data['sutki_dni'] = "суток";
	}

	if($data["sanid"] == 464917 and time() > 1641589200) {
    	$data['sutki_dni'] = "дней";
  	}

	if($data["sanid"] == 465157 and strtotime($data['data_zaezda']) < 1704067200) {
    	$data['sutki_dni'] = "дней";
  	}

	if($data["sanid"] == 489531 and strtotime($data['data_zaezda']) < 1704067200) {
		$data['sutki_dni'] = "дней";
	}

	if($data["sanid"] == 437471 and strtotime($data['data_zaezda']) < 1706745600) {
		$data['sutki_dni'] = "дней";
	}

	if(stripos($data['sutki_dni'], "дн") === false) {
	  $data['kolichestvo_dney'] = ((strtotime($data['data_vyezda']) - strtotime($data['data_zaezda']))/60/60/24);
	} else {
		$data['kolichestvo_dney'] = ((strtotime($data['data_vyezda']) - strtotime($data['data_zaezda']))/60/60/24) + 1;
	}
	
  return $data;
}

function isAllActiveGuestsHaveThisHealth($pril, $nameHealth) {
  $flag = true;
  foreach($pril as $guest) {
    if($guest["type_health"] !== $nameHealth) {
      $flag = false;
    }
  }
  return $flag;
}

function getShortName($nameManager) {
	$temp_name = explode(" ", $nameManager);
	$manager_insert = $temp_name[0]." ".substr($temp_name[1], 0, 2);
	if(isset($temp_name[2])) {
			$manager_insert = $manager_insert.". ".substr($temp_name[2], 0, 2).".";
	}
	return $manager_insert;
}

function checkField($field, $head) {
	return ($field != "") ? ' </w:t><w:br/><w:t>'.$head.': '.$field : '' ;
}

function getPrilozhenie($lead) {
	//Заполняем приложение к договору
	$arrTourist = [];

	$arrTourist = addTouristInArr($arrTourist,$lead, 305301, 324417, 324429, 324453, 324463);
	$arrTourist = addTouristInArr($arrTourist,$lead, 305303, 324419, 324435, 324455, 324465);
	$arrTourist = addTouristInArr($arrTourist,$lead, 305305, 324421, 324439, 324457, 324469);
	$arrTourist = addTouristInArr($arrTourist,$lead, 305307, 324423, 324441, 324459, 324471);

	for($q=0;$q<count($arrTourist);$q++) {
		$arrTourist[$q]+=["id"=>$q+1];
		unset($arrTourist[$q]['t_appart']);
		unset($arrTourist[$q]['t_feeding']);
		unset($arrTourist[$q]['t_th']);
	}
	return($arrTourist);
}

function getPrilozhenieDB($lead, $checkin, $checkout){
	global $db;
	global $isRadugaOn2Days;
	$outputarr = [];
	$kolichestvo_turistov = 0;
	$going = [];
	$not_going = [];
	$tip_nomera = [];
	$outputarr['not_rb'] = false;
	$is_all_price_not_null = true;
	$outputarr['specifictimeinandout'] = '';
	
	$st = $db->query('SELECT guests.typedoc as typedoc,
						guests.serial_numb_doc as serial_numb_doc,
						guests.fio as fio,
						DATE_FORMAT(guests.birthday, "%d.%m.%Y") as birthday,
						guests.address as address,
						guests.sitizen as sitizen,
						typerooms.name_type as name_type,
						guests.vidrazm as vidrazm,
						guests.food as food,
						guests.health as health,
						guests.banket as banket,
						guests.banket_price as banket_price,
						guests.banket_cur as banket_cur,
						lead_to_guest.checkguest as checkguest,
						guests.price as price,
						guests.valuta_price as valuta_price,
            programs.timeinandout as specifictimeinandout,
						sales.name as sales_name,
						sales.count_days as sales_count_days,
						guests.swim_pool as swim_pool,
						guests.child_banket as child_banket,
						guests.addressLife as addressLife,
						DATE_FORMAT(guests.dateApproveDocument, "%d.%m.%Y") as dateApproveDocument,
						guests.departmentApproveDocument as departmentApproveDocument,
						DATE_FORMAT(guests.checkIn, "%d.%m.%Y") as guestcheckin,
						DATE_FORMAT(guests.checkOut, "%d.%m.%Y") as guestcheckout,
						foundation.id as foundationId
	
						FROM guests
						left join lead_to_guest on guests.id=lead_to_guest.guest_id
            left join leads on lead_to_guest.lead_id=leads.id
            left join foundation on leads.`305089`=foundation.name
						left join typerooms on guests.typerooms=typerooms.id_type
                        left join programs on (guests.health = programs.name AND programs.foundation_id = foundation.id)
						left join sales on guests.sale_id=sales.id
						WHERE lead_to_guest.lead_id = '.$lead.'
            GROUP BY guests.id
						order by lead_to_guest.sort_position');
	$managerinfo = $st->fetchAll();
	$number = 1;
	
	foreach($managerinfo as $man) {
			if($man["sitizen"] != "РБ") {
				$outputarr['not_rb'] = true;
			};
			if($isRadugaOn2Days) {
				$man["food"] = 'Дежурное меню';
			}
			$docs = ($man["typedoc"] == "Нет") ? "" : ", ".$man["typedoc"]." ".$man["sitizen"]." ".$man["serial_numb_doc"];
			$dateApproveDocument = (isset($man['dateApproveDocument']) and $man['dateApproveDocument'] != "00.00.0000") ? ", дата выдачи документа, удостоверяющего личность: ".$man['dateApproveDocument'] : "";
			$departmentApproveDocument = ($man['departmentApproveDocument'] != "") ? ", орган, который выдал документ, удостоверяющий личность: ".$man['departmentApproveDocument'] : "";
			$birthday = ($man['birthday'] != "") ? ", д.р.".$man["birthday"] : '';

			$address = ($man["address"] == "") ? "" : ", ".$man["address"];
			$addressLife = ($man['addressLife'] != "") ? ", адрес проживания: ".$man['addressLife'] : "";

			//$sitizen = ($man["sitizen"] != "" and $man["typedoc"] == "Паспорт") ? ", гражданство ".$man["sitizen"] : "";
			// $sitizen = ", гражданство ".$man["sitizen"];
			$sitizen = ($man["typedoc"] == "Вид на жительство") ? "" : ", гражданство ".$man["sitizen"];

			if($man["checkguest"] == 1) {
				$checkin = (isset($man["guestcheckin"])) ? $man["guestcheckin"] : $checkin;
				$checkout = (isset($man["guestcheckout"])) ? $man["guestcheckout"] : $checkout;
				$guestSaleString = getDateWithSales($checkin, $checkout, $man["health"], $man["sales_name"], $man["sales_count_days"]);		
				$banket = ($man["child_banket"] !== "С утренником") ? $man["banket"] : $man["child_banket"];		
				$banket_price = $man["banket_price"];
				$banket_cur = $man["banket_cur"];		
				
				$filteredGoingGuestByNameAndCheckInOut = array_filter($going, function($el) use ($man) {
					// return $el["just_fio"] === $man["fio"] and $el["guestcheckout"] == $man["guestcheckin"]; 
					return $el["just_fio"] === $man["fio"] and strtotime($el["guestcheckout"]) >= (strtotime($man["guestcheckin"])- 60 * 60 * 24) and $el['birthday'] === $man['birthday'];
				});
				if(count($filteredGoingGuestByNameAndCheckInOut) == 0) {
					$kolichestvo_turistov++;
				}

				// $checkinout = (isset($man["guestcheckin"]) and $man["guestcheckin"] != "00.00.0000" and isset($man["guestcheckout"]) and $man["guestcheckout"] != "00.00.0000") ? ', заезд с '.$man["guestcheckin"].' по '. $man["guestcheckout"] : '';
				array_push($tip_nomera, $man["name_type"]);
				array_push($going,array("fio" => $man["fio"].$birthday.$docs.$address.$sitizen,
										"fioforbook" => $man["fio"].$birthday.$docs.$dateApproveDocument.$departmentApproveDocument.$address.$addressLife.$sitizen.", заезд ".$guestSaleString,
											"just_fio" => $man["fio"],
											"type_appart" => $man["name_type"],
											"kind_appart" => $man["vidrazm"],
											"feeding" => $man["food"],
											"type_health" => $man["health"],
											"id" => $number,
											"banket" => $banket,
											"banket_price" => $banket_price,
											"banket_cur" => $banket_cur,
											"price" => $man["price"],
											"valuta_price" => $man["valuta_price"],
											"sales_name" => $man["sales_name"],
											"sales_count_days" => $man["sales_count_days"],
											"guestcheckin" => $man["guestcheckin"],
											"guestcheckout" => $man["guestcheckout"],
											"swim_pool" => ($man["foundationId"] == 448583 and $man["health"] == 'С лечением') ? 'Нет' : $man["swim_pool"],
											"child_banket" => $man["child_banket"],
											"birthday" => $man['birthday']));
				
				if($man["price"] == 0 and $man["vidrazm"] != 'Без места') {
					$is_all_price_not_null = false;
				}
				
				if($man["specifictimeinandout"] != "") {
					$outputarr['specifictimeinandout'] = $man["specifictimeinandout"];
				}

				if(($man["health"] == 'Релакс' or $man["health"] == 'Семейная' or $man["health"] == 'Спа в Весте') 
						and date('w', strtotime($checkin)) == 5 
						and $man["foundationId"] == 450649) {
					$outputarr['specifictimeinandout'] = 'заезд в первый день путёвки с: 15:00, выезд в последний день путёвки до: 18:00';
				}

				$number++;
			} else {
				array_push($not_going,array("fio" => $man["fio"].", "." д.р. ".$man["birthday"].$docs.$address,
											"type_appart" => $man["name_type"],
											"kind_appart" => $man["vidrazm"],
											"feeding" => $man["food"],
											"type_health" => $man["health"],
											"id" => $number,
											"banket" => $man["banket"],
											"child_banket" => $man["child_banket"]));				
			}
		
	}

	$outputarr['going'] = $going;
	$outputarr['not_going'] = $not_going;
	$outputarr['tip_nomera'] = implode(", ", array_unique($tip_nomera));
	$outputarr['is_all_price_not_null'] = $is_all_price_not_null;
	$outputarr['kolichestvo_turistov'] = $kolichestvo_turistov;
	return($outputarr);
}

function getPrilozhenieUpdDB($data, $sumtransfer, $checkin, $checkout) {
	$outarr = [];
	$sd = [];
	$sales_details = '(';

	foreach($data as $d) {
		
		$checkin = (isset($d["guestcheckin"])) ? $d["guestcheckin"] : $checkin;
		$checkout = (isset($d["guestcheckout"])) ? $d["guestcheckout"] : $checkout;
		
		$justfio = mb_strstr($d["fio"],",",true);
		if(!$justfio) {
			$justfio = $d["fio"];
		}
		
		$guestSaleString = getDateWithSales($checkin, $checkout, $d["type_health"], $d["sales_name"], $d["sales_count_days"]);
		
		array_push($sd, $justfio.' '.$guestSaleString);
		
		if($d["sales_count_days"] !== NULL) {
			$d["type_health"] = $guestSaleString;
		}

		$prozhivanie = ($d["kind_appart"] == "Без места") ? "": "услуги проживания (".$d["type_appart"].", ".$d["kind_appart"]."), ";
		$pitanie = ($d["feeding"] == "Без питания") ? "" : "услуги питания (".$d["feeding"]."), ";
		$lechenie = ($d["type_health"] == "Без лечения") ? "" : "медицинские услуги (Лечение: ".$d["type_health"]."), ";
		$swim_pool = ($d["swim_pool"] == "Да") ? "услуги плавательного бассейна, " : "";
		$transfer = ($sumtransfer > 0) ? "услуги трансфера, " : "";
		$banket = ($d["banket"] == "С банкетом") ? "услуги по организации новогоднего банкета, " : "";
		$child_banket = ($d["child_banket"] == "С утренником") ? "услуги по организации детского новогоднего утренника, " : "";
		$inye_uslugi = "услуги, связанные с организацией туристического путешествия";
		
		$prilozhenie = "";
		if($prozhivanie == "" or $pitanie == "" or $lechenie == "") {
			$prilozhenie .= " (без оказания";
			$prilozhenie .= ($prozhivanie == "") ? " услуг проживания" : "";
			$prilozhenie .= ($pitanie == "") ? "," : "";
			$prilozhenie .= ($pitanie == "") ? " услуг питания" : "";
			$prilozhenie .= ($lechenie == "") ? "," : "";
			$prilozhenie .= ($lechenie == "") ? " медицинских услуг" : "";
			$prilozhenie .= ")";
		}
		$prilozhenie .= ";";
		array_push($outarr,["prilozhenie" => $d["fio"].", заезд с ".date('d.m.Y', strtotime($checkin))." по ".date('d.m.Y', strtotime($checkout))." - оказываются ".$prozhivanie.$pitanie.$lechenie.$swim_pool.$banket.$child_banket.$transfer.$inye_uslugi.$prilozhenie]);
	}
	
	foreach($sd as $el) {
		$sales_details .= $el;
		$sales_details .= ", ";
	}
	
	$sales_details = substr($sales_details,0,-2);
	$sales_details .= ")";
	$outarr[0]["salesdetails"] = $sales_details;

	return($outarr);
}

function getDateWithSales($checkin, $checkout, $type_health, $sales_name = NULL, $sales_count_days = NULL) {
	if($sales_count_days !== NULL) {
				$sale_from = new DateTime($checkout.' -'.$sales_count_days.' days');
				$sale_from = $sale_from->format('d.m.Y');
				return 'с '.date('d.m.Y', strtotime($checkin)).' по '.$sale_from.' «'.$type_health.'» + с '.$sale_from.' по '.date('d.m.Y', strtotime($checkout)).' «'.$sales_name.'»';
	} else {
				return 'с '.date('d.m.Y', strtotime($checkin)).' по '.date('d.m.Y', strtotime($checkout));
	}
}

function getPrilozhenieUpd($lead){
	//Заполняем приложение к договору
	$arrTourist = [];

	$arrTourist = addTouristInArr($arrTourist,$lead, 305301, 324417, 324429, 324453, 324463);
	$arrTourist = addTouristInArr($arrTourist,$lead, 305303, 324419, 324435, 324455, 324465);
	$arrTourist = addTouristInArr($arrTourist,$lead, 305305, 324421, 324439, 324457, 324469);
	$arrTourist = addTouristInArr($arrTourist,$lead, 305307, 324423, 324441, 324459, 324471);

	$arrpril = [];

	for($i = 0; $i<count($arrTourist); $i++) {
		
		$prilozhenie = "";
		$prilozhenie .= $arrTourist[$i]['fio'];
		$prilozhenie .= " - оказываются";
		$trig = false;
		
		if(($arrTourist[$i]['kind_appart'] != "Без места") or
			($arrTourist[$i]['feeding'] != "Без питания") or
			($arrTourist[$i]['type_health'] != "Без лечения")) {
				if($arrTourist[$i]['kind_appart'] != "Без места") {
					$prilozhenie .= " услуги проживания (".$arrTourist[$i]['type_appart'].", ".$arrTourist[$i]['kind_appart'].")";
				} else {$trig = true;}
				if(($arrTourist[$i]['kind_appart'] != "Без места") and ($arrTourist[$i]['feeding'] != "Без питания")) {
					$prilozhenie .= ",";
				}
				if($arrTourist[$i]['feeding'] != "Без питания") {
					$prilozhenie .= " услуги питания (".$arrTourist[$i]['feeding'].")";
				} else {$trig = true;}
				if(($arrTourist[$i]['feeding'] != "Без питания") and ($arrTourist[$i]['type_health'] != "Без лечения")) {
					$prilozhenie .= ",";
				}
				if($arrTourist[$i]['type_health'] != "Без лечения") {
					$prilozhenie .= " медицинские услуги (Лечение: ".$arrTourist[$i]['type_health'].")";
				} else {$trig = true;}
		};
			
		if(findcustomfieldval($lead,305137) > 0) {
			$prilozhenie .= " услуги трансфера";
		} else {$trig = true;};
			if($trig == true) {
				$prilozhenie .= ",";
			}
		
		$prilozhenie .= " услуги, связанные с организацией туристического путешествия";
		
			if(($arrTourist[$i]['kind_appart'] == "Без места") or
			($arrTourist[$i]['feeding'] == "Без питания") or
			($arrTourist[$i]['type_health'] == "Без лечения")) {
				$prilozhenie .= " (без оказания";
				if($arrTourist[$i]['kind_appart'] == "Без места") {
					$prilozhenie .= " услуг проживания";
				}
				if(($arrTourist[$i]['kind_appart'] == "Без места") and ($arrTourist[$i]['feeding'] == "Без питания")) {
					$prilozhenie .= ",";
				}
				if($arrTourist[$i]['feeding'] == "Без питания") {
					$prilozhenie .= " услуг питания";
				}
				if(($arrTourist[$i]['feeding'] == "Без питания") and ($arrTourist[$i]['type_health'] == "Без лечения")) {
					$prilozhenie .= ",";
				}			
				if($arrTourist[$i]['type_health'] == "Без лечения") {
					$prilozhenie .= " медицинских услуг";
				}
				$prilozhenie .= ")";
			};
		$prilozhenie .= ";";
		array_push($arrpril,array("prilozhenie" => $prilozhenie));
	}
	return($arrpril);
}


function addTouristInArr($arrTourist, $lead, $fioField, $typeAppartField, $kindAppartField, $feedingField, $healthField) {
		if(findcustomfieldval($lead,$fioField) != null) {
			array_push($arrTourist, array(
			'fio' => findcustomfieldval($lead,$fioField),
			'type_appart' => findcustomfieldval($lead,$typeAppartField),
			'kind_appart' => findcustomfieldval($lead,$kindAppartField),
			'feeding' => findcustomfieldval($lead,$feedingField),
			'type_health' => findcustomfieldval($lead,$healthField),
			't_appart' => (findcustomfieldval($lead,$kindAppartField) == "Без места") ? false : true ,
			't_feeding' => (findcustomfieldval($lead,$feedingField) == "Без питания") ? false : true ,
			't_th' => (findcustomfieldval($lead,$healthField) == "Без лечения") ? false : true
			));
		}
	return($arrTourist);
}

function findcustomfieldvalid($leadarray, $customfieldid ) {
	for($i=0;$i<count($leadarray["custom_fields"]);$i++) {
		if($leadarray["custom_fields"][$i]['id'] == $customfieldid) {
			$array = array();
			for($j=0;$j<count($leadarray["custom_fields"][$i]["values"]);$j++) {
				array_push($array, $leadarray["custom_fields"][$i]["values"][$j]['enum']);	
			}
			return $array[0];
			//return implode(",",$array);
		}
	}
}

function convert($sum, $out) {
	global $data;

	if(strtotime($data['data_dogovora']) >= 1681765200 and strtotime($data['data_dogovora']) < 1681938000) {
		$course = getInnerCursesFromDB($data['data_dogovora']);
		if($out == "BYN") {
			return round($sum * $course["BYNRUB"] / 100);
		} else {
			return round($sum / $course[$out."RUB"]);
		}
	}

	$val = find_kurs("RUB");
	$v_bel_rub = $sum * ($val["Cur_OfficialRate"]/$val["Cur_Scale"]);
	if($out == "BYN") {
		return round($v_bel_rub);
	} else {
		$val = find_kurs($out);
		return round($v_bel_rub * ($val["Cur_Scale"]/$val["Cur_OfficialRate"]));
	}
}

function find_kurs($cur) {
	global $currency;
	foreach($currency as $val) {
		if($val["Cur_Abbreviation"] == $cur) {
			return $val;
		}
	}
}

	function getCursFromNBRB($date) {
		$myCurl = curl_init();
		curl_setopt_array($myCurl, array(
			CURLOPT_URL => 'https://wg.belkurort.by/widget/price/getCursNBRBOnDate.php',
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_POST => true,
			CURLOPT_POSTFIELDS => http_build_query(array('date' => $date, 'hash' => 'jkdshglsdfoiguosdfignmdfsjhgkshdflgjhdsflkjg'))
		));
		$response = curl_exec($myCurl);
		curl_close($myCurl);
		
		if($response == "" or $response == null or $response === 0) {
			$myURL = 'http://www.nbrb.by/api/exrates/rates?';
			$options = array("ondate" => $date,"periodicity" => 0); 
			$myURL .= http_build_query($options,'','&'); 
				
			$curl = curl_init();
			curl_setopt($curl, CURLOPT_URL, $myURL);
			curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
			$currency = curl_exec($curl);
			curl_close($curl);
			return json_decode($currency,true); //получаем курсы на дату договора		
		} else {
			return(json_decode($response,true));
		}
	}

	function getInnerCursesFromDB($date) {
		$date = $date ? date('Y-m-d H:i:s',strtotime($date)) : date("Y-m-d H:i:s");

		global $db;
		$st = $db->query("SELECT * FROM inner_courses ORDER BY date ASC");
		$currencies = $st->fetchAll();
		$result = [
			"BYNRUB" => 0,
			"RUBBYN" => 0,
			"BYNEUR" => 0,
			"EURBYN" => 0,
			"BYNUSD" => 0,
			"USDBYN" => 0,
			"RUBEUR" => 0,
			"EURRUB" => 0,
			"RUBUSD" => 0,
			"USDRUB" => 0,
			"EURUSD" => 0,
			"USDEUR" => 0,
		];
		foreach($currencies as $currency) {
			if(strtotime($date)>=strtotime($currency["date"])) {
				foreach($result as $key => $value) {
					if($currency[$key] != 0) {
						$result[$key] = $currency[$key];
					}
				};	
			}
		};
		return $result;	
	}
	
	function getWorkDays($date) {
		$now = DateTime::createFromFormat("Y-m-d", date('Y-m-d',time()));
		$datetime1 = DateTime::createFromFormat("Y-m-d", date('Y-m-d',time()));
		$datetime2 = DateTime::createFromFormat("Y-m-d", date('Y-m-d',strtotime($date)));
		$interval = $datetime1->diff($datetime2);
		$woweekends = 0;

		for($i=0; $i<=$interval->d; $i++){
			   
			   $weekday = $datetime1->format('w');
				if($weekday != 0 && $weekday != 6){ // 0 for Sunday and 6 for Saturday
				   $woweekends++;  
				}
				$modif = $datetime1->modify('+1 day');
		}
		return ($woweekends > 1 and $now < $datetime2) ? $woweekends : 1;
	}

	function getNDSFraza($value, $valuta) {
		// global $isWithTax;
		if($value == null) return ', без НДС';
		return (isset($value)) ? ', в том числе НДС '.$value.' '.$valuta : '';
	}

	function service_list($data, $withPrice) {
		$param = $withPrice ? 'serviceListWithPrice' : 'serviceListWithoutPrice';
		$result = [];
		
		$lechenie = $data['dog_s_lecheniem'].' в соответствии с программой туристического путешествия';
		$turobsl = 'организация комплексного туристического обслуживания (услуги, связанные с организацией туристического путешествия)';
		$infouslugi = 'туристические информационные услуги (консультирование, поиск и предоставление информации, относящейся к путешествию)';
		
		if($withPrice) {
			$stoimostSan = $data['stoimost_sanatoriya'] - $data['sum_novogod_banketa'];
			$lechenie .= ' - '.$stoimostSan.' '.$data['valyuta'].getNDSFraza($data['stoimost_sanatoriya_tax'], $data['valyuta']);
			$turobsl .= ' - '.$data['turobsluzhivanie'].' '.$data['valyuta'].getNDSFraza($data['turobsluzhivanie_tax'], $data['valyuta']);
			$infouslugi .= ' - '.$data['infouslugi'].' '.$data['valyuta'].getNDSFraza($data['infouslugi_tax'], $data['valyuta']);
		};
		
		array_push($result, array($param => $lechenie));
		array_push($result, array($param => $turobsl));
		array_push($result, array($param => $infouslugi));

		if($data['newyear_program'] != '') {
			array_push($result, array($param => $data['newyear_program']));
		}

		if($withPrice) {
			if($data['sum_new_year'] != '') {
				array_push($result, array($param => $data['sum_new_year']));
			};
			if($data['sum_new_year_utrennik'] != '') {
				array_push($result, array($param => $data['sum_new_year_utrennik']));
			}
			if($data['dog_transfer_fraza'] != '') {
				array_push($result, array($param => $data['dog_transfer_fraza']));
			}
		} else {
			if($data['newyear'] != '') {
				array_push($result, array($param => $data['newyear']));
			}
			if($data['new_year_utrennik'] != '') {
				array_push($result, array($param => $data['new_year_utrennik']));
			}	
			if($data['dog_transfer_fraza_2'] != '') {
				array_push($result, array($param => $data['dog_transfer_fraza_2']));
			}
		}
		return $result;
	};

function isNeedChangeDueDays($contractDate, $checkinDate) {
	$contractWeekDayNum = getdate(strtotime($contractDate))["wday"];
	$checkinWeekDayNum = getdate(strtotime($checkinDate))["wday"];
	$dateDiff = date_diff(date_create($contractDate), date_create($checkinDate))->days;
	return ($contractWeekDayNum == 3 and ($dateDiff <= 5) and in_array($checkinWeekDayNum, array(0, 1, 5, 6)));
}

function isNeedStopAnyGeneration($contractDate, $checkinDate) {
	$contractWeekDayNum = getdate(strtotime($contractDate))["wday"];
	$checkinWeekDayNum = getdate(strtotime($checkinDate))["wday"];
	$dateDiff = date_diff(date_create($contractDate), date_create($checkinDate))->days;
	if($dateDiff <= 2) return true;
	return (in_array($contractWeekDayNum, array(4, 5)) and ($dateDiff < 5) and in_array($checkinWeekDayNum, array(0, 1, 5, 6)));
}
?>
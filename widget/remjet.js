class TypeFood {
	constructor(foodOptions) {
		this.$foodField = $('[data-id="313885"]');
		this.$foodFormOptions = this.$foodField.find('li.control--select--list--item');
		this.foodOptions = foodOptions;
		this.$actualFoodOptions = this.getActualFoodOptions();
	}

	getActualFoodOptions() {
		const $foodFormOptions = this.$foodFormOptions;
		const foodOptions = this.foodOptions;
		return this.$foodFormOptions.filter(function() {
			return [...foodOptions, {name: 'Выбрать'}].some(opt => $(this).text().indexOf(opt.name) > -1);
		});
	}

	showActualOptions() {
		this.$foodFormOptions.hide();
		this.$actualFoodOptions.show();
		return this;
	}

	selectFirstOption() {
		if(this.$actualFoodOptions.length > 1) {
			this.$actualFoodOptions[1].click();
		}
		return this;
	}

}

class BanSan {
	constructor(bannedList) {
		this.bannedList = bannedList;
	}
}

const hideForAll = [305191, 741240,
314783, 324415, 324427, 324451, 324461, // турист 1
305301, 324417, 324429, 324453, 324463, // турист 2
305303, 324419, 324435, 324455, 324465, // турист 3
305305, 324421, 324439, 324457, 324469, // турист 4
305307, 324423, 324441, 324459, 324471, // турист 5
];

const hideForAllExceptAdmin = [305299];

const blockForAll = [305285];

const blockForAllExceptAdmin = [305351, 305353, 
	305341, 305343 // Вкладка разделить клиента
];

// const blockForManagersAndClientics = [305091, 305093,
// 	305357, 305359, 305361, 305363, 305367, 305369, 343217, 318631, 377319, 378299, 378311, 384509, 385043, 377103, 732148, 761672 // вкладка оплата
// ];

const blockForManagers = [305355, 378075, 398360, 398362, // вкладка счёт
	398358, 398364, 398366, 398368, 398370, 371141, 378479, 370933, 370935, 393708, 381911, 381913, 398678, 398102 // вкладка воозврат
];

var RemoteGet = function () {
	const self = this;
	var widgetname = 'Удалённый виджет';
	self.amouser_id = APP.constant('user').id
	self.managers = APP.constant("managers")
	self.valuta = {
		437779: "BYN",
		524825: "USD",
		524827: "EUR"
	};
	self.priceScheduled = false;
	self.observers = [];
	self.pipelineObserver = null;
	self.system = self.system();
	self.sanWithBYNValAndEkv = ["437473", "783316", "471231",
															"486743", "465157", "501963",
															"475075", "470671",
															"495425", "453229",
															"480065", "490135", "448619",
															"454305", "487115", "474901",
															"464937", "489531",
															"473989", "454201", "467393",
															"526229", "491889", "465811",
															"530151", "509801", "448585",
															"474331", "464917",
															"468613", "478371", "486889",
															"491887", "493445", "497351",
															"515567", "530549", "535149",
															"537355", "729733", "737047",
															"534747", "523253", "485755",
															"452101", "448613", "448611",
															"448607", "448583",];
	self.sanPayingByAnyValutes = ["471121", "495425", "480065",
																"452101", "454305", "454201",
																"470671", "730657", "468613",
																"448615", "486889", "458451",
																"473417", "465029", "3989415",
																"5930754", "467375", "488835",
																"523253", "531911", "454245", "450649"];

	self.isAllCurrencyCoundition = function() {
		return true;
	};

	self.getfieldval = function (cfn) {
		let field = $("input[name='CFV[" + cfn + "]']");
		if (field.length > 0) {
			return field.val();
		} else {
			return "";
		};
	}
	
	self.copyInfoByNameLeadToNameContact = function() {
			$('[name="lead[NAME]"]').on('change', async (event) => {
				const leadName = event.target.value;
				const $firstName = $('[name="contact[FN]"]');
				const firstContactId = AMOCRM.data.current_card.linked_forms.form_models.models[0].attributes.ID;

				if ($firstName.length == 1 && leadName != "") {
					$firstName.val(leadName).click().change();
				} else if($firstName.length === 0 && !!leadName && firstContactId) {
					try {
						const response = await fetch(`https://${AMOCRM.widgets.system.domain}/api/v4/contacts`, {
							method: 'PATCH',
							cache: 'no-cache',
							body: JSON.stringify([
								{
									"id": Number(firstContactId),
									"name": String(leadName)
								}
							])
						});
						const result = await response.json();
					} catch(e) {
						console.error(e)
					}
				}
			})
	}

	self.addPreviewToFiles = function () {
		if(AMOCRM.data.current_entity != 'files') return;
		const list = AMOCRM.data.current_list.models;
		if(list.length == 0) return;

		const elements = document.querySelectorAll('.js-list-row:not(#list_head)');
		elements.forEach(el => {
			const id = el.dataset.id;
			const wrapper = el.querySelector('.content-table__item__inner-template-name');
			const img = document.createElement('img');
			const item = list.find(item => item.id == id).defaults;
			const link = item.download_link;
			if(!(/(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(item.extension)) return;
			img.src = list.find(item => item.id == id).defaults.download_link;
			img.style = 'height: 100px;';
			wrapper.style = 'height: 100px;';
			wrapper.append(img);
		});

			const observer = new MutationObserver((mutations) => {
				mutations.forEach(function (mutation) {
					if(mutation.type === "childList" && mutation.target.className.indexOf('modal-body__file') != -1) {
						const formEl = mutation.target.querySelector('.card-entity-form__top');
						const linkEl = formEl.querySelector('a');
						const img = document.createElement('img');
						if(!(/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i).test(linkEl.href)) return;
						img.src = linkEl.href;
						img.style = 'width: 100%;';
						linkEl.append(img);
					}
				});
			});

			observer.observe(document.body, {
				attributes: false,
				characterData: false,
				childList: true,
				subtree: true,
				attributeOldValue: false,
				characterDataOldValue: false
			});

			self.observers.push(observer);
	}

	self.setTransferTask = function () {
			var mutationObserver = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					if (mutation.target.className == "card-task__type-opened ") {
						var trig = false;
						if ($._data($('[value="1495075"]')[0], "events") != undefined) {
							$._data($('[value="1495075"]')[0], "events").click.forEach((e) => {
								if (e.namespace == "transfer") {
									trig = true;
								}
							})
						}
						if (!trig) {
							$('[value="1495075"]').on('click.transfer', () => {
								$('.control-contenteditable__area ').html(' \nДата: \nВремя: \nМесто встречи: \n№ рейса: \nВагон: \nМаршрут: \nТел: \nФИО: ')
							})
						}

					}
				});
			});

			mutationObserver.observe(document.documentElement, {
				attributes: true,
				characterData: true,
				childList: true,
				subtree: true,
				attributeOldValue: true,
				characterDataOldValue: true
			});

			self.observers.push(mutationObserver);
	}

	self.hideSitizen = function(allowSitizenId) {
			$('[name="CFV[377797]"]').parent()
															.find('li')
															.each((_, el) => {
																if(!allowSitizenId.includes(el.dataset.value)) {
																	$(el).hide();
																}
															});
	}

	self.perenosPoley = function () {
			$(".card-holder__fields .linked-form__field__label").css({ "white-space": "normal", "overflow": "hidden", "height": "auto" });
	}

	self.setPrice = function (val) {
			$('input[name="lead[PRICE]"]').val(val).change();
			$('.js-control-pretty-price').val(val).change();
	}

	self.correctPrice = function () {
			var prepay = +self.getfieldval(305359);
			var allpay = +self.getfieldval(305363);
			if (allpay > 0) {
				self.setPrice(prepay + allpay);
			}
	}

	self.strToDate = function (str) {
			if(!str) return new Date()
			return new Date(str.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
	}

	self.isCheckInValid = function () {
			const now = Math.round((new Date().getTime() / 1000))
			const dateCheckIn = self.strToDate($('[name="CFV[305203]"]').val())
			const timeCheckIn = Math.round(dateCheckIn.getTime() / 1000)
			const time45d = timeCheckIn - 45 * 24 * 60 * 60
			return (time45d <= now)
	}

	self.isKvota = function () {
			return ["Да", "1"].includes(AMOCRM.data.current_card.model.defaults['CFV[351975]'])
	}

	self.timedRaschetCen = function () {
		// console.log('price calc scheduled')
		if(self.priceScheduled == true)
			return;
		
		self.priceScheduled = true;
		setTimeout( () => {
			self.raschetsCen() 
			self.priceScheduled = false;
			// console.log('price calc ready')
		}, 1001);
	}

	self.raschetsCen = function () {
			let sancost = +self.getfieldval(305095);
			let turobsluzhivanie = +self.getfieldval(305091);
			let novy_god = +self.getfieldval(362303);
			let novy_god_program = +self.getfieldval(758042);
			let utrennik = +self.getfieldval(396460);
			let infouslugi = +self.getfieldval(305093);
			let transfer = +self.getfieldval(305137);
			let costUsl = (sancost + turobsluzhivanie + infouslugi + transfer + novy_god + utrennik + novy_god_program);
			let oplata = self.getfieldval(305173);

			let dateDog = self.getfieldval(305287);
			const dateArr = (dateDog != "") ? $('[name="CFV[305287]"]').val().split(".") : 0;
			const dateDogTimestamp = (dateArr == 0) ? 0 : new Date(dateArr[2], dateArr[1] - 1, dateArr[0]).getTime() / 1000 + 3 * 60 * 60;

			if(dateDogTimestamp > 1635368400 && dateDogTimestamp < 1636318800) {
				var q = 98
			} else if ((!self.sanPayingByAnyValutes.includes($('[name="CFV[305089]"]').val()) || $('[name="CFV[339925]"]').val() == "493015") && !self.isCheckInValid()) {
				var q = 98
			} else if (self.getfieldval(305333) == 437779) {
				var q = 98
			} else if (self.getfieldval(305333) == 437777 && (dateDog == "" || (dateDogTimestamp > 1619643600 && dateDogTimestamp <= 1620766800))) {
				var q = 98
			} else if (self.getfieldval(305333) == 437777 && ((dateDog == "" || (dateDogTimestamp > 1614546000)) && sancost > 99999) || AMOCRM.data.current_card.id === 19356266) {
				var q = 98
			} else {
				var q = 96.5
			}
			var ekvairing = (oplata == 437557) ? Math.round(((costUsl * 100 / q) - costUsl)) : 0;

			$("input[name='CFV[305139]']").val(Math.round(ekvairing)).change();
			$("input[name='CFV[305169]']").val(Math.round(costUsl + ekvairing)).change();
			$("input[name='CFV[305337]']").val(Math.round(costUsl)).change();

			//self.mandatoryComission.setComission()
			//Получаем валюту
			// let currency = +self.getfieldval(305333);

			console.log('цена: ' + costUsl);
			//заполняем стоимость услуг
			self.setPrice(costUsl);
	}

	self.mathDatysOnInit = function () {
		const cdays = $('input[name="CFV[313133]"]').val();
		const datefromval = $('input[name="CFV[305203]"]').val();
		// const datefrom = new Date(datefromval.split(".")[2] + "-" + datefromval.split(".")[1] + "-" + datefromval.split(".")[0]);
		const datetoval = $('input[name="CFV[305205]"]').val();
		// const dateto = new Date(datetoval.split(".")[2] + "-" + datetoval.split(".")[1] + "-" + datetoval.split(".")[0]);
		
		if(!cdays && !!datefromval && !!datetoval) self.mathdays();
	}

		self.mathdays = async function () {
			const countDaysField = $('input[name="CFV[313133]"]');
			const checkInField = $('input[name="CFV[305203]"]');
			const checkOutField = $('input[name="CFV[305205]"]');
			const denorsutField = $('input[name="CFV[313433]"]');

			const checkIn = new Date(checkInField.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
			const checkOut = new Date(checkOutField.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));

			if(denorsutField.val() == "") {
				await self.settingSan();
			}

			const diff = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24));

			if(!diff) {
				countDaysField.val('').change();
				return;
			}

			const result = (denorsutField.val().indexOf("дн") != -1) ? diff + 1 : diff;
			countDaysField.val(result).change();
			return;
		}

		self.settingSan = async function() {
			const sanId = $('input[name="CFV[305089]"]').val();
			if (sanId == "") return;

			try {
				const response = await fetch(`https://wg.belkurort.by/widget/infofound.php?sanid=${sanId}`, {
					method: 'POST',
					cache: 'no-cache',
					body: {sanId}
				});
				const result = await response.json();
				const checkIn = $('input[name="CFV[305203]"]').val();
				let denOrSut = result.denorsut;

				$('input[name="CFV[313433]"]').val(denOrSut).change();
				// self.mathdays();
				self.changeTypeFood(result.food);

			} catch(e) {
				console.error(e.message)
			}
		}

		self.initChekTypeFood = async function() {
			const sanId = $('input[name="CFV[305089]"]').val();
			if (sanId == "") return;

			try {
				const response = await fetch(`https://wg.belkurort.by/widget/infofound.php?sanid=${sanId}`, {
					method: 'POST',
					cache: 'no-cache',
					body: {sanId}
				});
				const result = await response.json();
				const typeFood = new TypeFood(result.food);
				typeFood.showActualOptions();
			} catch(e) {

			}
		}

		self.changeTypeFood = function(foodOptions) {
			const typeFood = new TypeFood(foodOptions);
			typeFood.showActualOptions().selectFirstOption();
		}

		self.getActualFoodOptions = function($foodFormOptions, foodOptions) {
			return $foodFormOptions.filter(function() {
				return [...foodOptions, {name: 'Выбрать'}].some(opt => $(this).text().indexOf(opt.name) > -1);
			})
		}

		self.isUDP = function() {
			const sanId = $('input[name="CFV[305089]"]').val();
			return [
				// '458451', 
				'486053', 
				'473417', 
				'452097'].includes(sanId) && ![23654798].includes(AMOCRM.data.current_card.id)
		}

		self.setTouroperator = async function() {
			const sanId = $('input[name="CFV[305089]"]').val();
			const touroperator = $('input[name="CFV[339925]"]').val();

			if(self.isUDP() && touroperator != '493015') {
				
				$('input[name="CFV[339925]"]').parent().find('button').click()
				$('input[name="CFV[339925]"]').parent().find('li[data-value="493015"]').click()

			}
		}

		self.blockUDPtoSan = async function() {
			const sanId = $('input[name="CFV[305089]"]').val();
			const touroperator = $('input[name="CFV[339925]"]').val();

			if(self.isUDP() && touroperator != '493015') {
				alert('Нельзя отправлять заявки в санатории Управ делами президента напрямую')
				$('input[name="CFV[339925]"]').parent().find('button').click()
				$('input[name="CFV[339925]"]').parent().find('li[data-value="493015"]').click()
				return false
			}
		}

		self.wait = async function(miliseconds = 500) {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve()
				}, miliseconds);
			})
		}

		self.getTypeAppart = function () {
			let sanid = $('input[name="CFV[305089]"]').val();
			if (sanid == "") { } else {
				var getnum = new Promise(function (resolve, reject) {
					$.ajax({
						url: 'https://wg.belkurort.by/widget/infoTypeAppart.php?sanid=' + sanid,
						method: 'POST',
						data: {
							sanid: sanid
						},
						success: function (msg) {
							obj = JSON.parse(msg);
							if (obj.error == false) {
								resolve("result");
							}
						},
						error: function () {
							alert('Error')
						}
					});
				});
				getnum.then(
					result => {
						if (obj.error == false && obj.hasOwnProperty("type_appart")) {
							//получаем типы номеров санатория
							var fields = obj.type_appart;
							//Получаем текущее значение поля типа номера
							var typeAppartField = ($('input[name="CFV[313921]"]').val() == "") ? "Выбрать" : $('input[name="CFV[313921]"]').val();
							//Генерируем поле
							var t = '<div class="linked-form__field linked-form__field-select "><div class="linked-form__field__label" style="white-space: normal; overflow: hidden; height: auto;"><span>Тип номера</span>  </div><div class="linked-form__field__value "><div class="control--select linked-form__select"><ul class="custom-scroll control--select--list">           <li data-value="" data-color="" class="control--select--list--item control--select--list--item-selected   " style=""><span class="control--select--list--item-inner" title="Выбрать">Выбрать</span></li>';
							for (i = 0; i < fields.length; i++) {
								var f = fields[i].replace(/&quot;/g, "");
								f = f.replace(/\\/g, "");
								f = f.replace(/'/g, "");
								
								t = t + '<li data-value=\'' + f + '\' data-color="" class="control--select--list--item    " style=""><span class="control--select--list--item-inner" title="' + f + '">' + f + '</span></li>';
							}
							t = t + '</ul><button class="control--select--button   " tabindex="" type="button" data-value=""><span class="control--select--button-inner">' + typeAppartField + '</span></button><input type="hidden" class="control--select--input " id="" name="typeAppart" value="" data-prev-value=""></div></div></div>';
							//Удаляем старое поле
							$('input[name="typeAppart"]').parent().parent().parent().remove();
							//добавляем новое
							$(t).insertAfter($('input[name="CFV[305179]"]').parent().parent().parent());
							//Вешаем обработчик на новое поле
							$("input[name=\"typeAppart\"]").change(function () {
								if ($(this).val() != "Выбор") {
									$('input[name="CFV[313921]"]').val($(this).val()).change();
									$('input[name="CFV[324415]"]').val($(this).val()).change();
									$('input[name="CFV[324417]"]').val($(this).val()).change();
									$('input[name="CFV[324419]"]').val($(this).val()).change();
									$('input[name="CFV[324421]"]').val($(this).val()).change();
									$('input[name="CFV[324423]"]').val($(this).val()).change();
								} else {
									$('input[name="CFV[313921]"]').val("").change();
								}
							});
							$('span.control--select--list--item-inner').css({ "white-space": "normal", "overflow": "hidden", "height": "auto" });
							$('span.control--select--button-inner').css({ "white-space": "normal", "overflow": "hidden", "height": "auto" });
							$('div.linked-form__select').css("height", "auto");
						}
					});
			}
		}

		self.transfer = function () {
			let sumtransfer = $('input[name="CFV[305137]"]').val();
			let currency = $('input[name="CFV[305333]"]').parent().find('span.control--select--button-inner').text();
			if (sumtransfer > 0) {
				$('input[name="CFV[312591]"]').val(" организация перевозки туристов автомобильным транспортом (трансфер) - " + sumtransfer + " " + currency + ";").change();
				$('input[name="CFV[313801]"]').val("организация перевозки туристов автомобильным транспортом (трансфер);").change();
				$('input[name="CFV[312599]"]').val("Да").change();
			} else { //без лечения
				$('input[name="CFV[312591]"]').val("").change();
				$('input[name="CFV[313801]"]').val("").change();
				$('input[name="CFV[312599]"]').val("Не требуется").change();
			}
		}

		self.currency = function () {
			let currency = $('input[name="CFV[305333]"]').val();
			let specpoleschet = $('input[name="CFV[313751]"]');
			if (currency == "437779") {//счёт в бел руб
				specpoleschet.val("BY95BPSB30123099770109330000").change();
			} else if (currency == "437777") { //счет в рос руб
				specpoleschet.val("BY43BPSB30123099770496430000").change();
			} else {
				specpoleschet.val("ЗАПРОСИТЬ У АЛЕКСАНДРЫ СЧЁТ").change();
			}
		}

		self.touristContract = function () {
			if ($('input[name="CFV[314783]"]').parent().parent().hasClass('is-checked') != true) {
				$('input[name="CFV[314777]"]').val($('input[name="CFV[305299]"]').val()).change();
			} else {
				$('input[name="CFV[314777]"]').val("").change();
			}
		}

		self.annulValidation = function () {
			if (AMOCRM.data.current_card) {
				var zayavka = $('input[name="CFV[305351]"]').val();
				var notapprove = (((AMOCRM.data.current_card.model.defaults['CFV[328497]'] == 1 || AMOCRM.data.current_card.model.defaults['CFV[328497]'] == "Да") && AMOCRM.data.current_card.model.changed['CFV[328497]'] == undefined) || AMOCRM.data.current_card.model.defaults['CFV[328497]'] == "" && (AMOCRM.data.current_card.model.changed['CFV[328497]'] == "Да" || AMOCRM.data.current_card.model.changed['CFV[328497]'] == "Нет"));
				let validationarr = AMOCRM.data.current_card.validator.rules.leads.p_1736272.s_143;
				let field = validationarr.indexOf("CFV[305353]");
				var kvota = (AMOCRM.data.current_card.form.model.attributes["CFV[351975]"]) ? true : false;
				if (zayavka != "" && field == -1 && notapprove == false && kvota == false) {
					validationarr.push("CFV[305353]");
				} else if (zayavka == "" && field != -1) {
					validationarr.splice(field, 1);
				} else if (notapprove == true) {
					validationarr.splice(field, 1);
				} else if (kvota == true) {
					validationarr.splice(field, 1);
				}
			}
		}

		self.ifFromOurKvota = function () {
			var valarr = AMOCRM.data.current_card.validator.rules.leads.p_1736272.s_26081356;
			if (AMOCRM.data.current_card.form.model.attributes["CFV[351975]"]) { //если квота заполнена то
				valarr.splice(valarr.indexOf("CFV[305351]"), 1);//удаляем валидацию
			} else {
				if (valarr.indexOf("CFV[305351]") == -1) { //если валидации нет
					valarr.push("CFV[305351]"); // заполняем валидацию
				}
			}
		}

		self.ifNewLeadOffChangeStatus = function () {
			if (location.pathname == "/leads/add/") {
				$('button.control--select--button-colored').prop("disabled", true);
			};
		}

		self.onlyGo = function () {
			if ([3406348, 3449320, 12335137, 9567381, 3504832].indexOf(self.amouser_id) !== -1) return;

			const st = +AMOCRM.data.current_card.model.attributes["lead[STATUS]"]; //получаем id текущего статуса
			const statuses = $('li[for*="1736272"]');
			if(st === 142) {
				statuses[0].parentNode.parentNode.style.display = 'none';
			}
			
			// const managers = self.managers.filter(mngr => mngr.is_admin === 'N')
			// const isMngr = managers.find(mngr => mngr.id == self.amouser_id);
			const managers_ids = [
				3456106,
				3449317,
				3449314,
				3449311,
				3449296,
				3449293,
				3524998,
				3673399,
				3933202,
				3943501,
				4780204,
				5861377,
				5879518,
				5879521,
				6173380,
				7100445,
				7300182,
				7454691,
				7651209,
				7974150,
				7998666,
				7998669,
				9790017,
				9875821,
				10038681,
				10066153,
				11497025,
				11991153];
			const isMngr = managers_ids.indexOf(self.amouser_id)>-1;

			console.log('found_id=' +isMngr);

			statuses.each((_, element) => {
				const $status = $(element);
				const elementStatusId = +$status.find('input')[0].value;
				if (st === 143) {
					$status.show();
					return;
				}

				if(isMngr && (elementStatusId === 142 || elementStatusId === 26726761)) {
					$status.hide();
				}

				if (elementStatusId != st) {
					$status.hide();
				} else {
					return false;
				}
			});
			statuses.find('input[value="26726761"], input[value="142"]').each((_, element) => {
				$(element).parent().hide();
			})
		}

		self.hidePiplinesByUserInLeadCard = function () {
			if (AMOCRM.getBaseEntity() != "leads") return // выходим, если не карточка сделки
			const users = [{
				id: 3406348,
				groupId: 1,
				allowPiplines: [1736272]
			}]

			const user = users.filter(user => user.id === self.amouser_id)[0]
			const currentPiplineId = AMOCRM.data.current_card.model.attributes["lead[PIPELINE_ID]"]
			!user.allowPiplines.find(el => el == currentPiplineId) && user.allowPiplines.push(currentPiplineId)

			$('label.pipeline-select__caption[for^="pipeline_"]').each((i, e) => {
				const pipeline = $(e).attr('for').match(/([0-9])+/gi)[0]
				if (!user.allowPiplines.find(allowPipline => allowPipline == pipeline)) {
					$(e).parent().remove()
				}
			})
		}

		self.hidePiplinesInLeadCard = function (exceptionUsersId, exceptionPiplinesId) {
			if (exceptionUsersId.find(user => user == self.amouser_id)) return;
			
			let pipeline
				if (AMOCRM.data.current_entity == "leads") {
					$('label.pipeline-select__caption[for^="pipeline_"]').each((i, e) => {
						pipeline = $(e).attr('for').match(/([0-9])+/gi)[0]
						if (!exceptionPiplinesId.find(exceptionPipline => exceptionPipline == pipeline)) {
							$(e).parent().remove()
						}
					})
				} else if (AMOCRM.data.current_entity == "leads-pipeline") {
					if(!exceptionPiplinesId.includes(AMOCRM.data.current_view?.current_pipeline?.id)) {
						AMOCRM.router.navigate('/leads/pipeline/' + exceptionPiplinesId[0], {trigger: true});
					}
				}
		}

		self.hidePipelinesFromLeftPanel = function (exceptionUsersId, exceptionPiplinesId, tries = 50) {
			if(self.pipelineObserver) self.pipelineObserver.disconnect();
			if(exceptionUsersId.includes(self.amouser_id)) return;

			const targetNode = document.getElementById('left_menu');
			// левое меню может быть ещё не отрисовано — ждём
			if(!targetNode) {
				if(tries > 0) setTimeout(() => self.hidePipelinesFromLeftPanel(exceptionUsersId, exceptionPiplinesId, tries - 1), 200);
				return;
			}

			self.pipelineObserver = new MutationObserver((mutations) => {
					mutations.forEach((mutation) => {
						if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
						const addedNodes = Array.from(mutation.addedNodes);
						addedNodes.forEach((node) => {
							if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('aside-hover-leads')) {
								const pipelines = node.querySelectorAll('li.aside__list-item');
								pipelines.forEach(pipeline => {
									const pipelineId = pipeline.getAttribute('data-id');
									if (!exceptionPiplinesId.includes(+pipelineId)) {
										pipeline.remove();
									}
								});
							}
						});
						}
					});
					});

			self.pipelineObserver.observe(targetNode, { childList: true, subtree: true });
		}

		self.blockBillField = function () {
			if (AMOCRM.data.current_card.model.defaults["lead[STATUS]"] != 142) {
				$('input[name="CFV[305355]"]').attr('disabled', 'disabled');
			} else {
				$('input[name="CFV[305355]"]').removeAttr('disabled');
			}
		}

		self.checkBill = function () {
			if (+$('input[name="CFV[305357]"]').val() != 0) {
				let dateTask = new Date();
				dateTask = new Date(dateTask.getFullYear(), dateTask.getMonth(), dateTask.getDate() + 1, 0, 0, -1);
				if (AMOCRM.data.current_card.form.model.changed["CFV[305357]"] != undefined || AMOCRM.data.current_card.form.model.changed["CFV[318631]"] != undefined || AMOCRM.data.current_card.form.model.changed["CFV[305095]"] != undefined) {
					if ((+$('input[name="CFV[305357]"]').val() + (+$('input[name="CFV[318631]"]').val())) != (+$('input[name="CFV[305095]"]').val())) {
						$.ajax({
							url: `https://${AMOCRM.widgets.system.domain}/private/notes/edit2.php`,
							method: 'POST',
							data: {
								"ACTION": "ADD_TASK",
								"BODY": "Не сходится сумма счёта",
								"MAIN_USER": 3504832,
								"TASK_TYPE": 1,
								"END_DATE": dateTask.toLocaleString("ru", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).replace(/,/g, ''),
								"DISABLE_WEBHOOKS": "N",
								"ELEMENT_ID": AMOCRM.data.current_card.id,
								"ELEMENT_TYPE": 2
							},
							success: function (data) {
							}
						});
					}
				}
			};
		}

		self.hideValutes = function () {
			const declinedUsers = [3406348, 3449320, 12335137, 9567381]
			if (!declinedUsers.includes(self.amouser_id)) {
				$('[name="CFV[305333]"]').parent().find('ul').find('li').each((index, el) => {
					if (["437779", ""].indexOf(el.dataset.value) == -1 
							&& !self.isAllCurrencyCoundition()) {
						el.style.display = "none"
					} else {
						el.style.removeProperty('display');
					}
				})
			}
		}

		self.changeValutes = function () {
			const valuta = $('[name="CFV[305333]"]')
			const statusId = AMOCRM.data.current_card.model.attributes["lead[STATUS]"]
			const declinedStatuses = ["142", "26726761"]
			const declinedUsers = [3504832]

			if (!self.isAllCurrencyCoundition() && 
					valuta.val() != "437779" &&
					!declinedStatuses.includes(statusId) &&
					!declinedUsers.includes(AMOCRM.data.current_card.user.id)) {
						valuta.parent().find('button').click()
						valuta.parent().find('li[data-value="437779"]').click()
			}
		}

		self.forPriozerny = function () {
			if ($('input[name="CFV[305089]"]').val() != "486053") {
				$('li[data-value="518055"').hide();
				$('li[data-value="518057"').hide();
				$('li[data-value="518059"').hide();
				$('li[data-value="518061"').hide();
			} else {
				$('li[data-value="518055"').show();
				$('li[data-value="518057"').show();
				$('li[data-value="518059"').show();
				$('li[data-value="518061"').show();
			}
		}

		self.correctCostSan = function () {
			$("input[name='CFV[305095]']").val(Number($("input[name='CFV[305359]']").val()) + Number($("input[name='CFV[305363]']").val()) - Number($("input[name='CFV[305091]']").val()) - Number($("input[name='CFV[305093]']").val()) - Number($("input[name='CFV[305137]']").val()) - Number($("input[name='CFV[362303]']").val()) - Number($("input[name='CFV[396460]']").val()) - Number($("input[name='CFV[758042]']").val())).change();
			self.checkComissionAndCost();
			self.timedRaschetCen();
		}

		self.checkComissionAndCost = function () {
			if (Number($("input[name='CFV[318631]']").val()) + Number($("input[name='CFV[305357]']").val()) != Number($("input[name='CFV[305095]']").val()) && AMOCRM.data.current_card.model.attributes["lead[STATUS]"] == 142) {
				alert("Проверь размер комиссии и себестоимость санатория");
			}
		}

		self.checkPrim = function (filedId) {
			if([25598352].includes(APP.data.current_card.id)) return;
			$('[name="CFV[' + filedId + ']"]').on('change', () => {
				var notkvota = ['квот', 'kvot', 'квoт', 'kboт', 'kbot', 'к в о т', 'кв о т', 'кво т', 'к.в.о.т', 'кво.т'];
				notkvota.forEach(function (item) {
					if ($('[name="CFV[' + filedId + ']"]').val().toLowerCase().indexOf(item) != -1) {
						alert("В примечании к заявке ЗАПРЕЩЕНО писать по поводу квот! Мы напишем об этом за вас на основании поля Квота");
						$('[name="CFV[' + filedId + ']"]').val("").change();
						AMOCRM.data.current_card.save();
					}
				});
			})
		}

		self.notNull = function (filedId) {
			$('[name="CFV[' + filedId + ']"]').on('change', (event) => {
				if (+event.target.value < 25) {
					$('[name="CFV[' + filedId + ']"]').val(30).change();
				}
			})
		}

		self.setTaskIfSetReturn = function () {
			var date = new Date();
			date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, -1);
		}

		self.changeStatusIfInputPay = function () {
			var date = new Date();
			date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, -1);
		if (AMOCRM.data.current_card.form.model.defaults["CFV[305359]"] != AMOCRM.data.current_card.form.model.attributes["CFV[305359]"]) {//предоплата
				$.ajax({
					url: `https://${AMOCRM.widgets.system.domain}/private/notes/edit2.php`,
					method: 'POST',
					data: {
						"ACTION": "ADD_TASK",
						"BODY": "Получена оплата на сумму " + AMOCRM.data.current_card.form.model.attributes["CFV[305359]"] + " рос. руб.",
						"MAIN_USER": AMOCRM.data.current_card.main_user,
						"TASK_TYPE": 1,
						"END_DATE": date.toLocaleString("ru", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).replace(/,/g, ''),
						"DISABLE_WEBHOOKS": "N",
						"ELEMENT_ID": AMOCRM.data.current_card.id,
						"ELEMENT_TYPE": 2
					},
					success: function (data) {
					}
				});
				$('.pipeline-select-wrapper__inner__holder').click();
				$('input[value="26726761"]').click();
				AMOCRM.data.current_card.save();
			}
		}

		self.requestController = function () {
			$.ajaxSetup({
				success: function (jqXHR) {
					var date = new Date();
					date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, -1);
					if (jqXHR && jqXHR.task && jqXHR.task.type == "1495078") {
						$.ajax({
							url: `https://${AMOCRM.widgets.system.domain}/private/notes/edit2.php`,
							method: 'POST',
							data: {
								"ACTION": "ADD_TASK",
								"BODY": "Готовим возврат!",
								"MAIN_USER": AMOCRM.data.current_card.main_user,
								"TASK_TYPE": 1457761,
								"END_DATE": date.toLocaleString("ru", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).replace(/,/g, ''),
								"DISABLE_WEBHOOKS": "N",
								"ELEMENT_ID": AMOCRM.data.current_card.id,
								"ELEMENT_TYPE": 2
							},
							success: function (data) {
							}
						});
					}
				}
			});
		}

		self.taskOnChangeSumOfBill = function () {
			if (AMOCRM.data.current_card.form.model.attributes["lead[STATUS]"] == "142" &&
				AMOCRM.data.current_card.form.model.attributes["CFV[305095]"] != AMOCRM.data.current_card.form.model.defaults["CFV[305095]"] &&
				AMOCRM.data.current_card.form.model.defaults["CFV[305095]"] != "") {
				var date = new Date();
				date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, -1);
				$.ajax({
					url: `https://${AMOCRM.widgets.system.domain}/private/notes/edit2.php`,
					method: 'POST',
					data: {
						"ACTION": "ADD_TASK",
						"BODY": "Изменена стоимость санатория",
						"MAIN_USER": 3449320,
						"TASK_TYPE": 1,
						"END_DATE": date.toLocaleString("ru", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).replace(/,/g, ''),
						"DISABLE_WEBHOOKS": "N",
						"ELEMENT_ID": AMOCRM.data.current_card.id,
						"ELEMENT_TYPE": 2
					},
					success: function (data) {
					}
				});
			}
		}

		self.updateJustEditedCFV = function () {
			if (!XMLHttpRequest.proxyget) {
				XMLHttpRequest.proxyget = true;
				(function (XHR) {

					var open = XHR.prototype.open;
					var send = XHR.prototype.send;

					XHR.prototype.open = function (method, url, async, user, pass) {
						this._url = url;
						open.call(this, method, url, async, user, pass);
					};

					XHR.prototype.send = function (data) {
						var self = this;
						var url = this._url;

						if (url == '/ajax/leads/detail/') {
							let urlParams = new URLSearchParams(data)
							let entries = urlParams.entries()
							let cleanIt = paramsToObject(entries)
							for (fieldName in cleanIt) {
								if (fieldName.indexOf('CFV') != -1) {
									if (cleanIt[fieldName] == AMOCRM.data.current_card.model.defaults[fieldName]) {
										delete cleanIt[fieldName]
									}
								}
							}
							data = ($.param(cleanIt))
						}
						send.call(this, data);
					}
				})(XMLHttpRequest);
			}

			function paramsToObject(entries) {
				let result = {}
				for (let entry of entries) { // each 'entry' is a [key, value] tupple
					const [key, value] = entry;
					result[key] = value;
				}
				return result;
			}

		}

		self.emptyWidgetField = function () {
			const emptyWidgetDiv = document.createElement('div')
			emptyWidgetDiv.className = "emptyWidgetDiv"
			emptyWidgetDiv.style.padding = "50px"
			document.querySelector('.card-widgets__elements').append(emptyWidgetDiv)
		}

		self.offInputFields = function (fieldsArray) {
			fieldsArray.forEach(field => {
				const $field = document.querySelector(`[name="CFV[${field}]"]`)
				if(!$field) return;
				// $field.setAttribute("disabled", "disabled")
				$field.setAttribute("readonly", "readonly")
				$field.parentElement.classList.add('linked-form__field__value_disabled')
				$field.parentElement.parentElement.classList.add('linked-form__field__label_disabled')
			})
		}

		self.openKeyboardOnMobile = function (cf, tries = 50) {
			// Выбираем целевой элемент
			var target = document.querySelector(`[name="CFV[${cf}]"]`);
			// поле может быть ещё не отрисовано к моменту bind_actions — ждём
			if (!target) {
				if (tries > 0) setTimeout(() => self.openKeyboardOnMobile(cf, tries - 1), 200);
				return;
			}
			// Конфигурация observer (за какими изменениями наблюдать)
			const config = {
				attributes: true
			};
			// Функция обратного вызова при срабатывании мутации
			const callback = function (mutationsList, observer) {
				let deleted = false;
				for (let mutation of mutationsList) {
					if (mutation.type === 'attributes' && mutation.attributeName === "readonly" && mutation.oldValue === null && !deleted) {
						mutation.target.removeAttribute("readonly")
						mutation.target.setAttribute("inputmode", "numeric")
						deleted = true
					}
				}
			};

			// Создаем экземпляр наблюдателя с указанной функцией обратного вызова
			const observer = new MutationObserver(callback);

			// Начинаем наблюдение за настроенными изменениями целевого элемента
			observer.observe(target, config);

			self.observers.push(observer);
		}

		self.closeWazzupWindow = function (tries = 50) {
			// Выбираем целевой элемент
			const target = document.getElementById('card_holder');
			// карточка может быть ещё не отрисована — ждём
			if (!target) {
				if (tries > 0) setTimeout(() => self.closeWazzupWindow(tries - 1), 200);
				return;
			}
			// Конфигурация observer (за какими изменениями наблюдать)
			const config = {
				attributes: true
			};
			// Функция обратного вызова при срабатывании мутации
			const callback = function (mutationsList, observer) {
				for (let mutation of mutationsList) {
					if (mutation.type === 'attributes' && mutation.target.style.right == "265px") {
						mutation.target.style.removeProperty("right");
					}
				}
			};

			// Создаем экземпляр наблюдателя с указанной функцией обратного вызова
			const observer = new MutationObserver(callback);

			// Начинаем наблюдение за настроенными изменениями целевого элемента
			observer.observe(target, config);

			self.observers.push(observer);
		}

		self.isAdmin = function() {
			return [3406348].indexOf(self.amouser_id) != -1
		}
		
		self.guestFinder = () => {
			// выбираем нужный элемент
			const searchSuggestContainer = document.querySelector('#search-suggest-drop-down-menu');
			const sidebar = document.getElementById('sidebar');

			const leadsBlockHtml = function(leads, maxNumber = 10) {
				if(!leads.length) return '<div></div>';
				const offsetLeadsCount = leads.length - (maxNumber);
				const guestsHTMLArray = leads.map((lead, index) => {
					return `<a href="/leads/detail/${lead.id}" class="js-navigate-link-search-suggest ${(index > (maxNumber - 1)) ? 'hidden' : ''}">
										<div class="search-results__row-section__right-column__result js-search-suggest-result">
											<div class="search-results__row-section__right-column__result__nowrap-container">
												<span class="search-results__row-section__right-column__result__element">${lead.fio}</span>
												<div class="lead-status-only"></div>
												<span class="search-results__row-section__right-column__result__element" style="color: #363b44;">Сделка: ${lead.name}</span>
											</div>
										</div>
									</a>`
				});
				if(offsetLeadsCount > 0) {
					guestsHTMLArray.push(`<a href="#" class="js-navigate-link-search-suggest" id="offsetGuests">
																	<div class="search-results__row-section__right-column__result__show-all js-search-suggest-result">
																		<span class="show-all-link">Показать все (${offsetLeadsCount})</span>
																	</div>
																</a>`);
				}
				const guestsHTML = guestsHTMLArray.join('')
				return `<div class="search-results__row-section">
									<div class="search-results__row-section__left-column">Гости</div>
									<div class="search-results__row-section__right-column" id="guestsSection"> 
										${guestsHTML}
									</div>
								</div>`;
			}

			const mutationFunc = function () {
				let isOriginal = false;
				const old = {}

				const makeQuery = async (query) => {
					
					if(!query) return [];
					const response = await fetch(`https://wg.belkurort.by/widget/guests/getLeadsByGuest.php?query=${query}`, {
									method: 'GET',     
									headers: {
										'Content-Type': 'application/json',
										'Auth': 'nYK4dxa{bFQoQEEq%AibWTrW'
									}
								});
					const result = await response.json();
					return result;
				}

				const getQuery = () => {
					let query = document.getElementById('search_input').value;
					query = query.replace(/[^a-zA-ZА-Яа-яЁё\s]/gi,'');
					return query.toLowerCase();
				}

				const isTheSameQuery = query => (old.query && old.result && (query.indexOf(old.query) !== -1));

				const getResultFromOld = query => old.result.filter(el => el.fio.toLowerCase().indexOf(query) !== -1);
				
				return async (_) => {
					const query = getQuery();

					if (query.length < 3 || /^\s*$/.test(query)) return;
					if(!isOriginal) {
						isOriginal = true;
						sidebar.classList.add('page-loading');
						const isSameQuery = isTheSameQuery(query);
						const result = isSameQuery ? getResultFromOld(query) : await makeQuery(query);

						if(!isSameQuery) {
							old.result = result;
							old.query = query;
						}
						
						const html = leadsBlockHtml(result, 5);
						searchSuggestContainer.insertAdjacentHTML('afterbegin', html);
						
						const button = searchSuggestContainer.querySelector('#offsetGuests');
						
						if(button) {
							button.onclick = e => {
								e.preventDefault();
								e.stopPropagation();
								document.getElementById('guestsSection').querySelectorAll('a').forEach(el => el.classList.remove('hidden'));
								button.classList.add('hidden');
							};
						}

						sidebar.classList.remove('page-loading');
					} else {
						isOriginal = false;
					}
				}
			}();
			const observer = new MutationObserver(mutationFunc);
			if(searchSuggestContainer) {
				// создаем новый экземпляр наблюдателя
				observer.observe(searchSuggestContainer, { childList: true });
			}

			// создаём функцию для очистки обзёрвера
			self.offGuestFinderObserver = function() {
				observer && observer.disconnect();
			}
		}

		self.stopChangeResponsibleUser = () => {
			if(![3406348, 3449302, 12485533].includes(self.amouser_id)) {
    		const area = AMOCRM.widgets.system.area;
        $("#cf5stopchangeresp").attr("id") || $("body").append('<style>#list_multiple_actions .list-multiple-actions__item[data-type=reassign]{display:none!important;}.tr_responsible .card-cf-table__td-right > div{display:none;}#edit_card.card-entity-form-add-mode .tr_responsible .card-cf-table__td-right > div{display:block;}</style><div style="display:none;" id="cf5stopchangeresp"></div>');
        -1 < ["ccard", "lcard", "comcard"].indexOf(area) && ($("#lead_main_user-users_select_holder").off().on("click", function(a) {
            return !1
        }),
        $(".tr_responsible .card-cf-table__td-right > div").css("display", "block"));
        -1 < ["llist", "clist", "comlist"].indexOf(area) && ($(".list-multiple-actions__item__icon icon icon-reassign").off().on("click", function(a) {
            return !1
        }),
        $(".tr_responsible .card-cf-table__td-right > div").css("display", "block"));
        -1 < ["llist", "clist", "comlist"].indexOf(area) && $(".list-row__cell-manager").each(function() {
            $(this).removeClass("js-list-row__cell")
        })
			}
		}

		self.banket = () => {
			const BANKET_LIST_FIELD_ID = 762126;
			const BANKET_COST_FIELD_ID = 362303;
			const PIPELINE_ID = 1736272;
			const NEW_LEAD_STATUS = 26081347;
			const UNSUCCESS_STATUS = 143;
			const NEED_LIST_OPTION_ID = '798884';
			const COST_INCLUDE_IN_PRICE_OPTION = '798882';

			const $checkIn = $('[name="CFV[305203]"]');
			const $checkOut = $('[name="CFV[305205]"]');

			const $banket = $('[name="CFV[762124]"]');
			const $banketField = $('[name="CFV[762124]"]');
			const $banketListField = $(`[name="CFV[${BANKET_LIST_FIELD_ID}]"]`);
			const $banketCostField = $(`[name="CFV[${BANKET_COST_FIELD_ID}]"]`);

			const banketFields = [	
															$banket, 
															$('[name="CFV[396460]"]'), 
															$('[name="CFV[758042]"]'),
														];

			// if(![25150820, 25121414].includes(APP.data.current_card.id)) {
			// 	$(`li[data-value="${COST_INCLUDE_IN_PRICE_OPTION}"]`).hide();
			// }

			hideField($('[name="CFV[349953]"]'));
			hideBanketFields();
			[$checkIn, $checkOut].forEach(el => el.change(hideBanketFields));

			$banket.change(() => {
				isNeedList();
				!isShowList();
				// && skipField($banketListField);
				isNeedBanketCost();
				!isCostIncludeInPrice() && skipField($banketCostField);
			});

			function hideBanketFields() {
				const checkInYear = new Date($checkIn.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')).getFullYear();
				const checkOutYear = new Date($checkOut.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')).getFullYear();
				// const isBanketOn = checkInYear < checkOutYear;
				const isBanketOn = false;
				
				banketFields.forEach(field => {
					if(isBanketOn) {
						showField(field)
					} else {
						hideField(field)
					}
				});

				isNeedList();
				isNeedBanketCost();
			}

			function isCostIncludeInPrice() {
				return $banketField.val() === COST_INCLUDE_IN_PRICE_OPTION;
			}
			function isNeedBanketCost() {
				if(isCostIncludeInPrice()) {
					showField($banketCostField);
					addFieldValidationById({id: BANKET_COST_FIELD_ID, status: NEW_LEAD_STATUS});
					addFieldValidationById({id: BANKET_COST_FIELD_ID, status: UNSUCCESS_STATUS});
				} else {
					hideField($banketCostField);
					removeFieldValidationById({id: BANKET_COST_FIELD_ID, status: NEW_LEAD_STATUS});
					removeFieldValidationById({id: BANKET_COST_FIELD_ID, status: UNSUCCESS_STATUS});
				}
			}
			function isShowList() {
				return $banketField.val() === NEED_LIST_OPTION_ID;
			}
			function isNeedList() {
				if(isShowList()) {
					// showField($banketListField);
					addFieldValidationById({id: BANKET_LIST_FIELD_ID, status: NEW_LEAD_STATUS});
					addFieldValidationById({id: BANKET_LIST_FIELD_ID, status: UNSUCCESS_STATUS});
				} else {
					// hideField($banketListField);
					removeFieldValidationById({id: BANKET_LIST_FIELD_ID, status: NEW_LEAD_STATUS});
					removeFieldValidationById({id: BANKET_LIST_FIELD_ID, status: UNSUCCESS_STATUS});
				}
			}
			function skipField($field) {
					setTimeout(() => {
						$field.val(' ').change()
						setTimeout(() => {
							$field.val('').change()
						}, 300) // С этим значением происходит сброс предыдущей валидации. Выявлено эксперементальным путём. 
					}, 0);
			}
			function hideField($field) {
				$field.parents('.linked-form__field').addClass('hidden');
			}
			function showField($field) {
				$field.parents('.linked-form__field').removeClass('hidden');
			}
			function addFieldValidationById({id, status}) {
				const rules = AMOCRM.data.current_card.validator.rules.leads[`p_${PIPELINE_ID}`][`s_${status}`];
				if(!rules.includes[`CFV[${id}]`]) {
					rules.push(`CFV[${id}]`);
				}
			}
			function removeFieldValidationById({id, status}) {
				AMOCRM.data.current_card.validator.rules.leads[`p_${PIPELINE_ID}`][`s_${status}`] =
					AMOCRM.data.current_card.validator.rules.leads[`p_${PIPELINE_ID}`][`s_${status}`]
						.filter(fieldId => fieldId != `CFV[${id}]`);
			}
		}

		self.hideCK = () => {
			$('li[data-value="493015"]').each((_, el) => {
				$(el).hide()
			})
		}

		// части карточки создаются не сразу — ждём появления значения перед использованием
		self.whenReady = (getValue, callback, label = 'значение', tries = 50) => {
			const value = getValue();
			if(value) {
				callback(value);
				return;
			}
			if(tries <= 0) {
				console.warn(`remjet: ${label} так и не появилось`);
				return;
			}
			setTimeout(() => self.whenReady(getValue, callback, label, tries - 1), 200);
		}

		self.onCardModelReady = (callback) =>
			self.whenReady(() => APP.data.current_card?.model, callback, 'APP.data.current_card.model');

		self.onSaveBtnReady = (callback) =>
			self.whenReady(() => {
				const $btn = AMOCRM.data.current_card?.$save_btn;
				return $btn && $btn.length ? $btn : null;
			}, callback, 'AMOCRM.data.current_card.$save_btn');

		self.stopAccomodationSale = () => {
			const banSan = [
											// {
											// 	id: 537355, 
											// 	name: "Свитязь"
											// },
											{
												id: 473989, 
												name: "Серебряные ключи"
											},
											{
												id: 471283, 
												name: "Жемчужина",
												hiddenRules: [
													{
														fn: checkInDateStopSaleRange,
														params: [new Date('02/03/2025'), new Date('02/09/2025')],
														reason: "В санатории Магистральный закрыты продажи с 3 по 9 февраля. Дата заезда сброшена",
														callback: skipCheckIn
													}
												],
											},
											// {
											// 	id: 495425, 
											// 	name: "Магистральный",
											// 	hiddenRules: [
											// 		{
											// 			fn: checkInDateStopSaleRange,
											// 			params: [new Date('04/15/2025'), new Date('05/10/2025')],
											// 			reason: "В санатории Магистральный закрыты продажи с 15 апреля по 10 мая. Дата заезда сброшена",
											// 			callback: skipCheckIn
											// 		}
											// 	],
											// },
											{
												id: 515567, 
												name: "Лесное",
												hiddenRules: [
													{
														fn: checkInDateStopSaleRange,
														params: [new Date('12/01/2024'), new Date('12/23/2024')],
														reason: "В санатории Лесное ремонт с 13.12.2024 по 23.12.2024. Дата заезда сброшена",
														callback: skipCheckIn
													}
												],
											},
											// {
											// 	id: 471283, 
											// 	name: "Жемчужина",
											// 	hiddenRules: [
											// 		{
											// 			fn: checkInDateStopSaleRange,
											// 			params: [new Date('08/19/2024'), new Date('12/24/2024')],
											// 			reason: "В санатории Жемчужина ремонт с 19.08.2024. Дата заезда сброшена",
											// 			callback: skipCheckIn
											// 		}
											// 	],
											// },
											// {
											// 	id: 471189, 
											// 	name: "Ленина",
											// 	hiddenRules: [
											// 		{
											// 			fn: checkInDateStopSale,
											// 			params: [new Date('10/01/2025')],
											// 			reason: "Продажи закрыты",
											// 			callback: skipCheckIn
											// 		}
											// 	],
											// },
											{
												id: 501963, 
												name: "Березина",
												hiddenRules: [
													{
														fn: checkInDateStopSale,
														params: [new Date('01/01/2023')],
														reason: "Комиссия в данный санаторий меньше 10%! Продажи с 01.01.2023 запрещены.",
														callback: skipCheckIn
													}
												],
											},
											{
												id: 730657, 
												name: "Железнодорожник",
												hiddenRules: [
													{
														fn: checkInDateStopSale,
														params: [new Date('01/01/2023')],
														reason: "Комиссия в данный санаторий меньше 10%! Продажи с 01.01.2023 запрещены.",
														callback: skipCheckIn
													}
												],
											},
											{
												id: 485755, 
												name: "Нарочанский берег",
												hiddenRules: [{
													fn: () => true,
													params: [],
													reason: "Санаторий Нарочанский берег был присоединён к санаторию Нарочь. Поле санатория скорректировано.",
													callback: selectSanik.bind(this, [448617])
												}]
											}
			];

			const $sanik = $('[name="CFV[305089]"]');
			const $valuta = $('[name="CFV[305333]"]');
			const $checkIn = $('[name="CFV[305203]"]');

			hideNativePoints();
			hideFindModulePoints();

			self.onCardModelReady(cardModel => {
				cardModel.on('change', (model) => {
					if([305333, 305203].some(id => model.changed[`CFV[${id}]`])) {
						checkRules(false);
					}
				});
			});

			// $checkIn.change(checkRules);
			// $valuta.change(checkRules);

			function skipCheckIn() {
				$checkIn.val('').change().blur().addClass('empty');
			}

			async function changeValuta(id) {
				$valuta.val(id || '').trigger('controls:change');
			}

			function selectSanik(id) {
				$sanik.val(id ? String(id) : '').trigger('controls:change');
			}

			function checkRules(el) {
				banSan.find(san => +san.id === Number($sanik.val()))?.hiddenRules.some(rule => {
					if(rule.fn.apply(this, rule.params)) {
						if(rule.callback) rule.callback();
						if(rule.reason) alert(`${rule.reason}`);
						return true;
					}
					return false;
				});
				hideNativePoints();
			}

			function bannedSanListIds() {
				return banSan.reduce((acc, san) => {
					if(!san.hiddenRules) acc.push(san.id);
					if(san.hiddenRules && san.hiddenRules.map(rule => rule.fn.apply(this, rule.params)).some(rule => rule)) acc.push(san.id);
					return acc;
				}, []);
			}

			function hideNativePoints() {
					$sanik.parent().find('ul.control--select--list')[0]?.childNodes.forEach(li => {
							$(li).show();
							if(bannedSanListIds().includes(li.dataset?.value)) $(li).hide();
					})  
			}

			function hideFindModulePoints() {
					observer = new MutationObserver((mutations) => {
							mutations.forEach(function (mutation) {
													if(!mutation.target.classList.contains('cf_select_search_input_inner')) return;
													if(!mutation.addedNodes[0]?.classList.contains('searched_list_elements')) return;
													
													mutation.addedNodes[0].childNodes.forEach(li => {
														if(bannedSanListIds().includes(li.value)) $(li).hide();
													})
							});
						});

					if(!$sanik.parent()[0]) return;
					observer.observe($sanik.parent()[0], {
									attributes: false,
									characterData: false,
									childList: true,
									subtree: true,
									attributeOldValue: false,
									characterDataOldValue: false
					});
					self.observers.push(observer);
			}

			function accessValutaIds(valutaIdsArr) {
				if(!Array.isArray(valutaIdsArr)) {
					console.error('Первый агрумент функции должен быть массивом!');
					return true;
				}
				valutaIdsArr.push(0);
				return !valutaIdsArr.map(valuta => Number(valuta)).includes(+$valuta.val());
			}

			function checkInDateStopSale(stopDate) {
				if(!(stopDate instanceof Date && !isNaN(stopDate.valueOf()))) {
					console.error('Аргумент должен быть датой');
					return true;
				}
				const checkInDate = new Date($checkIn.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
				return (checkInDate.getTime() >= stopDate.getTime());
			}

			function checkInDateStopSaleRange(stopDate, startDate) {
				if(!(stopDate instanceof Date && !isNaN(stopDate.valueOf()))) {
					console.error('Аргумент должен быть датой');
					return true;
				}
				const checkInDate = new Date($checkIn.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
				return (checkInDate.getTime() >= stopDate.getTime() && checkInDate.getTime() <= startDate.getTime());
			}
		}

		self.stopSaleAfterSeptember = () => {
			const checkInField = $('[name="CFV[305203]"]');
			checkInField.change(() => {
				const dateCheckIn = self.strToDate(checkInField.val());
				if(dateCheckIn >= new Date('2023/10/01') && ![24563314, 24249964].includes(APP.data.current_card.id)) {
					alert('Продажи с датами заезда с 01.10.2023 закрыты');
					checkInField.val('').change();
				}
			})
		}

		self.rasschetCen = [305095, 362303, 758042, 396460, 305091, 305093, 305137, 305333, 305173];

		self.selectRightWhatsappChannel = () => {
			if(!APP.data.is_card || APP.data.current_entity !== 'leads') return;
			const timeout = setTimeout(() => {
				const span = $('[data-value="5508831305"]');
				if(!span.length) return;
				if(APP.data.current_card.getPipelineId() === 6862105) {
					span.click();
				} else if(APP.data.current_card.getPipelineId() === 1736272) {
					$('[data-value="5508826810"]').click();
				}
				setTimeout(() => $('button[class^=gnzs-wa][tabindex]').click(), 1000);
				clearTimeout(timeout);
			}, 3000);
		}

		self.profileMessengersExpander = () => {
			if(!APP.data.is_card || APP.data.current_entity !== 'leads') return;
			Object.values(document.getElementsByClassName('profile_messengers-item-ru.gnzs.whatsapp.1')).forEach((el, i, arr) => (i < arr.length - 1) && el.remove() );
		}

		self.skipSanValidation = (leadIds) => {
			if(leadIds.includes(APP.data.current_card.id)) {
				Object.keys(APP.data.current_card.validator.rules.leads.p_1736272).forEach(field => {
					const f = APP.data.current_card.validator.rules.leads.p_1736272[field];
		 			APP.data.current_card.validator.rules.leads.p_1736272[field] = f.filter(el => el !== 'CFV[305089]');
				})
			}
		}
		
		this.callbacks = {
			render: function () {
				self.perenosPoley();
				self.ifNewLeadOffChangeStatus();

				return true;
			},
			init: function () {
				APP.ifvisible = { now: () => true };
				self.hidePipelinesFromLeftPanel([3406348, 3504832, 3449320, 12335137, 9567381, 3449308, 3449311, 7100445, 7974150], [1736272, 6862105]);
				return true;
			},
			bind_actions: function () {
				// на карточке сделки почти всё завязано на current_card.model,
				// а он создаётся позже bind_actions — откладываем вызов целиком,
				// пока ничего не успело навеситься (иначе получим дубли обработчиков)
				const isLeadCard = location.pathname.indexOf('/leads/detail/') != -1 || location.pathname.indexOf('/leads/add/') != -1;
				if (isLeadCard && !APP.data.current_card?.model) {
					self.onCardModelReady(() => self.callbacks.bind_actions());
					return true;
				}

				self.stopChangeResponsibleUser();

				const findBtn = $('#save_and_close_contacts_link')
				if(findBtn) {
					findBtn.on('click', function() {
						self.timedRaschetCen();
						//console.log('price recalc on saving.');
					});
				}

				// self.addPreviewToFiles();
				if (location.pathname.indexOf('/leads/detail/') != -1 || location.pathname.indexOf('/leads/add/') != -1) {
					// if(!self.isAdmin()) self.stopSaleAfterSeptember();
					self.stopAccomodationSale();
					self.openKeyboardOnMobile("345077");
					self.emptyWidgetField();

					self.onCardModelReady(cardModel => {
						cardModel.on('change', (model) => {
							if(self.rasschetCen.some(id => model.changed[`CFV[${id}]`])) {
								self.timedRaschetCen();
							}
							if(model.changed['lead[STATUS]']) {
								self.onlyGo();
							}
							if([305203, 305205, 313433].some(id => model.changed[`CFV[${id}]`])) {
								self.mathdays();
							}
						});
					});

					if ([3449320, 9567381, 12335137].indexOf(self.amouser_id) != -1) {
						self.whenReady(
							() => AMOCRM.data.current_card?.validator?.rules?.leads?.p_1736272?.s_26081356,
							rules => {
								AMOCRM.data.current_card.validator.rules.leads.p_1736272.s_26081356 = rules.filter(a => a != "CFV[346135]" && a != "CFV[346137]");
							},
							'validator.rules.leads.p_1736272.s_26081356'
						);
						self.onSaveBtnReady($saveBtn => {
							$saveBtn.on('click', () => {
								self.changeStatusIfInputPay();
								self.taskOnChangeSumOfBill();
							});
						});
						$("input[name='CFV[305363]']").on('input', () => { self.correctCostSan(); });
					}
					self.requestController();
					self.copyInfoByNameLeadToNameContact();
					self.hideValutes();
					self.onSaveBtnReady($saveBtn => {
						$saveBtn.on('click', () => {
							self.blockBillField();
							self.checkBill();
						});
					});

					$("input[name='CFV[305139]']").change(() => { $('[name="CFV[305169]"]').val(Number($('[name="CFV[305337]"]').val()) + Number($('[name="CFV[305139]"]').val())).change() });
					$("input[name='CFV[305173]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении способа оплаты

					$("input[name='CFV[305095]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Стоимость санатория
					$("input[name='CFV[305091]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Туробслуживание
					$("input[name='CFV[305093]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Инфоуслуги
					$("input[name='CFV[305137]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Трансфер
					$("input[name='CFV[305139]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Эквайринг

					$("input[name='CFV[305195]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Количество туристов
					$("input[name='CFV[313133]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Количество дней
					$("input[name='CFV[305089]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Выбранный санаторий
					$("input[name='CFV[305333]']").on('change', function () { self.timedRaschetCen() }); //изменяем просчёт при изменении Валюта



					$('input[name="CFV[305089]"]').change(function () {
						self.hideValutes();
						self.changeValutes();
						// self.forPriozerny();
						self.settingSan();
						// setTimeout(() => self.mathdays(), 500);
					}); //изменяем настройки санатория
					self.hideCK();
					$('[name="CFV[339925]"]').change(function () {
						self.hideValutes()
						self.changeValutes()
					});
					$('input[name="CFV[305203]"]').change(function() {
						if(!self.isAllCurrencyCoundition()) {
							self.changeValutes()
						}
						self.settingSan()
					})
					$('input[name="CFV[305203]"], input[name="CFV[305205]"]').change(function () {
						self.hideValutes()
						self.changeValutes()
						// self.mathdays()
					});

					$('input[name="CFV[351975]"]').change(() => { 
						//если бронирование из нашей квоты - заявку не нужно отправлять
						self.ifFromOurKvota();
					});

					let previousKvotaVal = AMOCRM.data.current_card.model.defaults["CFV[351975]"]
					setInterval(() => {
						const model = AMOCRM.data.current_card?.model;
						if (model && model.defaults["CFV[351975]"] != previousKvotaVal) {
							previousKvotaVal = model.defaults["CFV[351975]"]
							self.hideValutes()
							self.changeValutes()
						}

					}, 5000)

					self.ifFromOurKvota();

					self.annulValidation();
					$('input[name="CFV[305351]"], input[name="CFV[328497]"], input[name="CFV[351975]"]').change(function () { self.annulValidation() });
					// if ([3406348, 3449320, 9567381, 12335137].indexOf(self.amouser_id) == -1) {
					// 	self.onlyGo();
					// 	AMOCRM.data.current_card.$save_btn.click(self.onlyGo);
					// }
					self.onlyGo();

					self.blockBillField();
					// self.forPriozerny();

					if ([3406348, 3449320, 9567381, 12335137].indexOf(self.amouser_id) == -1) {
						self.notNull(305091);
						self.notNull(305093);
					}

					if (![12929843, 19411346, 19447672].includes(AMOCRM.data.current_card.id)) {
						self.checkPrim(327491); 
						self.checkPrim(334611);
					};

					if([3406348, 3449308, 3449311, 7100445, 7974150].indexOf(self.amouser_id) === -1) {
						self.hideSitizen(["747661", "747663", ""]);
					}
					self.banket();
					self.closeWazzupWindow();
					// self.selectRightWhatsappChannel();
					self.profileMessengersExpander();
					self.mathDatysOnInit();
					self.initChekTypeFood();
					self.skipSanValidation([26164414]);

				} else if (location.pathname.indexOf('/leads/pipeline/') != -1 && [3406348, 3449320, 9567381, 12335137, 12485533].indexOf(self.amouser_id) == -1) {
					$('a[title="Список"]').hide();
					$('.pipeline_leads__item').on('mousedown', () => { return false });
				} else if (location.pathname.indexOf('/leads/list/') != -1 && [3406348, 3449320, 12335137, 9567381, 3504832, 3563083, 12485533].indexOf(self.amouser_id) == -1) {
					// alert("Доступ запрещён. Для получения доступа обратитесь к Ярославу");
					AMOCRM.router.navigate('/leads/pipeline/1736272', {trigger: true});
				}
				if(['llist', 'outer_space'].includes(self.system.area)) {
					self.guestFinder()
				}

				$('.gnzs-whatsapp-sources-styles').remove();
				setTimeout(() => {
					$('.gnzs-whatsapp-sources-styles').remove();
				}, 2300)

				return true;
			},
			settings: function () {
				return true;
			},
			onSave: function () {
				alert('Сохранено!');
				return true;
			},
			destroy: function () {
				if(self.offGuestFinderObserver) {
					self.offGuestFinderObserver();
				}
				self.observers.forEach(observer => observer.disconnect())
			},

		};
		return this;
};
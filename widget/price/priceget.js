
define(['jquery','lib/components/base/modal'], function($, Modal) {
	return function () {
		var self = this;
		var widgetname = 'Виджет Цен';
		self.leadId = APP.data.current_card?.id;
		self.valutes = { 437779: "BYN", 437777: "RUB", 524825: "USD", 524827: "EUR" };
		self.cssUrl = 'https://wg.belkurort.by/widget/price/advancedSettings.css';
		self.vueUrl = 'https://unpkg.com/vue@3.2.36/dist/vue.global.prod.js';
		self.hash = "jkdshglsdfoiguosdfignmdfsjhgkshdflgjhdsflkjg";
		self.getCurrentValutaCode = () => self.valutes[$('input[name="CFV[305333]"]').val()];
		self.dateContractField = $('input[name="CFV[305287]"]');
		self.getDateContract = () => (self.dateContractField.val() == "" || self.dateContractField.val() === undefined) ? new Date() : new Date(self.dateContractField.val().replace(/(\d+).(\d+).(\d+)/, '$3-$2-$1') + 'T00:00:00.000Z');
		self.kursNBRB = [];
		self.innerKurs = [];
		self.searchSanatoriiNow = false;
		self.currency = {
			innerCurs: {},
			getInnerCurs: async function (date = new Date()) {
				if(this.innerCurs[date]) return this.innerCurs[date];
				const response = await fetch('https://wg.belkurort.by/widget/price/getInnerCoursesByDateRangeFromDB.php', {
						method: 'POST',
						body: JSON.stringify({
							hash: self.hash, 
							dateFrom: date.toLocaleDateString(), 
							dateTo: date.toLocaleDateString()
						})
					});
				const json = await response.json();
				const result = json.reduce((acc, el) => {
					acc[new Date(el.date).toLocaleDateString()] = el;
					this.innerCurs[new Date(el.date).toLocaleDateString()] = el;
					return acc;
				}, {});
				return this.innerCurs[date.toLocaleDateString()];
			},
			convertRubInValDog: async function(field) {
				const valutaContract = self.getCurrentValutaCode();
				const fieldValue = $('input[name="CFV[' + field + ']"]').val();
				if(valutaContract == "RUB") return fieldValue;

				const dateContract = self.getDateContract();
				const currentCurs = await this.getInnerCurs(dateContract);
				const rubcurs = currentCurs[`${valutaContract}RUB`];
				if(valutaContract == "BYN") return fieldValue * rubcurs / 100;
				return fieldValue / rubcurs;
			},
			printConvertedValue: async function(field) {
				const value = await this.convertRubInValDog(field);
				return Math.ceil(value).toLocaleString('ru');
			}
		};
		self.converter = {
			fieldIds: [305095, 305091, 305093, 305169, 305337, 305139, 372377, 305137, 362303, 305363, 305359, 370933, 381911, 396460, 758042],
			printConvertedValue: async function (el) {
				const convertedValue = (self.getDateContract() >= new Date("2023-04-18") 
																&& self.getDateContract() <= new Date("2023-04-19")
																&& ![22849956].includes(self.leadId)) 
																	? await self.currency.printConvertedValue(el) 
																	: Math.round(self.convertRUBinValDog(el)).toLocaleString('ru');
				$('#' + el + '-convert-field').text(`${convertedValue} ${self.getCurrentValutaCode()}`);
			},
			onChangeValue: function (el) {
				$('input[name="CFV[' + el + ']"]').change(() => {
					setTimeout(() => self.converter.printConvertedValue(el), 100);
				})
			},
			init: async function () {
				//отрисовываем дополнительные поля
				this.fieldIds.forEach(self.renderConvertField);
				try {
						//забираем курсы НБРБ
						self.kursNBRB = await self.getCoursesNBRNOnDate();
						//обновляем значения
						this.fieldIds.forEach(this.printConvertedValue);
						// this.fieldIds.forEach(this.onChangeValue);
						APP.data.current_card.model.on('change', (model) => {
							[...this.fieldIds, 305333, 305287].forEach(this.printConvertedValue);
						});
						//ставим триггер на изменение значений при изменении валюты или даты договора
						// $('input[name="CFV[305333]"], input[name="CFV[305287]"]').change(() => {
						// 	this.fieldIds.forEach(this.printConvertedValue);
						// });
					} catch {
							arrayConvertFieldsId.forEach(el => {
								$('#' + el + '-convert-field').text(`ошибка`)
							})
					}
			}
		};
		self.system = self.system();
		self.isAdmin = function () {
			return [3406348, 3449320, 9567381, 12335137, 12485533].includes(self.system.amouser_id)
		}
		self.isCentrKurort = () => $('input[name="CFV[339925]"]').val() == "493015"
		self.getCurs = function (uri) {
			return new Promise(function (resolve, reject) {
				$.ajax({
					url: uri,
					method: 'GET',
					success: function (result) {
						result = JSON.parse(result);

						resolve(result);
					},
					error: function () {
						reject();
					}
				});
			});
		}
		self.renderButton = function (buttonText, id, className = '') {
			return self.render({
				ref: '/tmpl/controls/button.twig'
			}, {
				text: buttonText,
				id: id,
				class_name: className
			});
		},
			/*self.render = function(name,id) {
				return self.render({
								ref: '/tmpl/controls/button.twig'
							}, {
								name: name,
								id: id,
								disabled: "disabled",
								readonly: "true",
								type: "numeric",
								class: "card-budget__input",
								autosize_width: true,
								min_size: "10px"
							});
			},*/
			self.renderInput = function (inputName, id, disabled = true) {
				return self.render({
					ref: '/tmpl/controls/input.twig'
				}, {
					name: inputName,
					id: id,
					type: 'numeric',
					class_name: 'js-control-allow-numeric-float',
					value: 0,
					disabled: disabled,
					readonly: disabled
				});
			},

			self.renderConvertField = function (cfvn) {
				const html = `<div style="display: flex;align-items: center;"><div id="${cfvn}-convert-field" style="color: grey;">Загрузка...</div></div>`

				$('[name="CFV[' + cfvn + ']"]').parent().css("display", "flex");
				$('[name="CFV[' + cfvn + ']"]').css('width', '40%');
				$('[name="CFV[' + cfvn + ']"]').parent().append(html);
			},

			self.getCoursesNBRNOnDate = function (date = self.getDateContract().toLocaleDateString('ru')) {
				return new Promise(function (resolve, reject) {
					//const date = $('input[name="CFV[305287]"]').val();
					$.ajax({
						url: 'https://wg.belkurort.by/widget/price/getCursNBRBOnDate.php',
						method: 'POST',
						data: {
							date: date,
							hash: self.hash
						},
						success: function (msg) {
							result = JSON.parse(msg);
							resolve(result);
						},
						error: function () {
							alert('Error')
						}
					});
				})
			},
			self.getInnerCoursesOnDate = async function () {
				return new Promise(function (resolve, reject) {
					const date = self.getDateContract().toLocaleDateString('ru');
					$.ajax({
						url: 'https://wg.belkurort.by/widget/price/getInnerCoursesFromDB.php',
						method: 'POST',
						data: {
							date: date,
							hash: self.hash
						},
						success: function (msg) {
							obj = JSON.parse(msg);
							result = obj;
							result.date = date
							resolve(result);
						},
						error: function () {
							alert('Error')
						}
					});
				})
			},
			self.convertRUBinValDog = function (field) {
				const valCode = $('input[name="CFV[305333]"]').val()
				if (!valCode) return
				let dogcurs = self.valutes[valCode];
				let resultConv = $('input[name="CFV[' + field + ']"]').val()
				if (dogcurs != "RUB") {
					const rubcurs = self.kursNBRB.filter(curs => curs["Cur_Abbreviation"] == "RUB")
					resultConv = resultConv * rubcurs[0].Cur_OfficialRate / rubcurs[0].Cur_Scale

					if (dogcurs != "BYN") {
						const dogValCurs = self.kursNBRB.filter(curs => curs["Cur_Abbreviation"] == dogcurs)
						resultConv = resultConv / dogValCurs[0].Cur_OfficialRate
					}
				}
				return resultConv
			},
			self.convertSumValDogInRUB = function (sum, valuta) {
				if (!valuta) return
				if (valuta != "RUB") {
					const rubcurs = self.kursNBRB.filter(curs => curs["Cur_Abbreviation"] == "RUB")
					const oneBYNinRUB = rubcurs[0].Cur_Scale / rubcurs[0].Cur_OfficialRate
					if (valuta == "BYN") {
						sum = sum * oneBYNinRUB
					} else {
						const valCurs = self.kursNBRB.filter(curs => curs["Cur_Abbreviation"] == valuta)
						sum = sum * valCurs[0].Cur_OfficialRate * oneBYNinRUB
					}
				}
				return Math.round(sum)
			},

			self.addModal = function (data, widthval) { //функция добавляет модальное окно в dom
				modal = new Modal({
					class_name: 'modal-price',
					init: function ($modal_body) {
						var $this = $(this);
						$modal_body
							.trigger('modal:loaded') // запускает отображение модального окна
							.html(data)
							.css('width', widthval)
							.trigger('modal:centrify')
							.append('');
					},
					destroy: function () { }
				});
			},

			self.initLeadStatusInit = function () {
				let leadStatusInit = '';
				const statusBtn = $("ul.pipeline-select__dropdown")
				if(statusBtn) {
					const el1 = document.getElementsByClassName("pipeline-select__dropdown__item_selected");
					if(el1 && el1.length > 0) {
						const ch = el1[0].getElementsByClassName("pipeline-select__item-text")
						if(ch && ch.length > 0) {
							leadStatusInit = ch[0].innerText;
						}
					}
				}
				self.leadStatusInit = leadStatusInit;
				return leadStatusInit;
			},

			self.openingChannelCheck = function() {
				setTimeout(function () {
					const elNames = document.getElementsByClassName("tag");
					if(elNames && elNames.length > 0) {
						for(var i = 0; i < elNames.length; i++) {
							const dTag = ''+elNames[i].innerText;
							var chOpen = '';
							if(dTag.indexOf('Zdravkurort_Bibik_MAX') > -1)
								chOpen = 'Zdravkurort_Bibik_MAX'
							if(dTag.indexOf('Zdravkurort_Bolgova_MAX') > -1)
								chOpen = 'Zdravkurort_Bolgova_MAX'
							if(dTag.indexOf('Zdravkurort_Petrova_MAX') > -1)
								chOpen = 'Zdravkurort_Petrova_MAX'
							if(dTag.indexOf('Zdravkurort_Bibik_WhatsApp') > -1)
								chOpen = 'Zdravkurort_Bibik_WhatsApp'
							if(dTag.indexOf('Zdravkurort_Bolgova_WhatsApp') > -1)
								chOpen = 'Zdravkurort_Bolgova_WhatsApp'
							if(dTag.indexOf('Zdravkurort_Petrova_WhatsApp') > -1)
								chOpen = 'Zdravkurort_Petrova_WhatsApp'
							if(chOpen.length > 1) {
								const opChannel = document.getElementsByName("CFV[796652]");
								if(opChannel && opChannel.length > 0)
									opChannel[0].value = chOpen;
							}
						}
					}
				}, 1000);

			},
			
			self.dogovorGenerationCheck = function () {
				// if(self.isAdmin() && self.leadStatusInit === "Закрыто и не реализовано") {
				// console.log('dogovor generation check : ' + self.leadStatusInit);
				if(self.leadStatusInit === "Договор" || self.leadStatusInit === "Ожидаем оплату" || self.leadStatusInit === "Не все оплатил" || self.leadStatusInit === "Успешно реализовано") {
					// console.log('dogovor check: ' + AMOCRM.data.current_card.id + ' status: ' + self.leadStatusInit);

					setTimeout(function () {
						const elNames = document.getElementsByClassName("diskGet");
						if(elNames && elNames.length > 0) {
							const dGet = elNames[0];

							const clickEvent = new MouseEvent('click', {
								view: window,
								bubbles: true,
								cancelable: true,
							});
							dGet.dispatchEvent(clickEvent);



							setTimeout(function () {
								const tableDiskGet = document.getElementsByClassName("diskGet-table");
								if(tableDiskGet && tableDiskGet.length > 0) {
									const cell1 = tableDiskGet[0].getElementsByClassName("diskGet-cell")
									if(cell1 && cell1.length > 0) 
										if((''+cell1[0].innerText).indexOf('Генерация') >= 0) {
											const openEvent = new MouseEvent('click', {
												view: window,
												bubbles: true,
												cancelable: true,
											});
											cell1[0].dispatchEvent(openEvent);


											// setTimeout(function () {
											// 	var dogovorGenerated = false;
											// 	const elNames = document.getElementsByClassName("diskGet-cell-name");
											// 	if(elNames && elNames.length > 0) {
											// 		for(var i = 0; i < elNames.length && !dogovorGenerated; i++) {
											// 			const pdfDocName = elNames[i].innerText;
											// 			const dogov = pdfDocName.indexOf('Договор') >= 0;
											// 			if(dogov === true)
											// 				dogovorGenerated = true;
											// 		}
											// 	}

											// 	console.log('dogovor: ' + dogovorGenerated);

											// 	const generated = document.getElementsByName("CFV[796596]");
											// 	if(generated && generated.length > 0)
											// 		if(generated[0].value !== 'Да')
											// 			generated[0].value = dogovorGenerated ? 'Да' : 'Нет';
											// }, 2000);




										}									
								}
							}, 2000);


						}
					}, 1000);


				}
			},

			self.getLeadStatus = function () {
				const statusBtn = $("ul.pipeline-select__dropdown")
				if(statusBtn) {
					const el1 = document.getElementsByClassName("pipeline-select__dropdown__item_selected");
					if(el1 && el1.length > 0) {
						const ch = el1[0].getElementsByClassName("pipeline-select__item-text")
						if(ch && ch.length > 0) {
							const leadStatus = ch[0].innerText
							return leadStatus
						}
					}
				}
			},

			self.delayStatusCheck = function (showAlert) {
				// const leadStatusInit = self.leadStatusInit;
				const leadStatus = self.getLeadStatus();
				if(leadStatus == "Закрыто и не реализовано") {
					console.log('to Закрыто и не реализовано');
					// console.log('status: ' + AMOCRM.data.current_card.id + ' <' + leadStatus +'>'+ ' <' + leadStatusInit +'>' )
					if(showAlert)
						alert('Нельзя менять статус из "Не все оплатил" на "Закрыто и не реализовано"');
					// document.location = document.location;
					self.errorStatus = true;
				} else
					self.errorStatus = false;
				return self.errorStatus;
			},

			self.statusOptionsBlock = function () {
				// const leadStatusInit = self.leadStatusInit;
				const leadStatus = self.getLeadStatus();

				const statusBtn = $("ul.pipeline-select__dropdown")
				if(statusBtn) {
					if(
						self.isAdmin() == false && leadStatus == "Успешно реализовано"
					) {
						statusBtn.on('click', function() {
							return false;
						});
					}
 
					if(
						self.isAdmin() == false && leadStatus == "Не все оплатил"
						|| self.isAdmin() == true && leadStatus == "Не все оплатил"
						// self.isAdmin() == true && leadStatusInit == "Не все оплатил" && leadStatus == "Закрыто и не реализовано"
					) {
						console.log('Attempt to change from Не все оплатил')
						statusBtn.on('click', function() {
							setTimeout(() => {
								self.delayStatusCheck(false)
							}, 444);
							return true;
						});
					}
				}
			},

			self.foundationComboBox = function () {

				const sanatorii = $("div.linked-form__field-select[data-id='305089']")
				if(sanatorii) {
					const sBtn = sanatorii.find("button.control--select--button")
					if(sBtn) {
						sBtn.on('click', function() {
							self.searchSanatoriiNow = true;
							self.hideSanatorii();
						});
					}
				}
			},

			self.hideSanatorii = function () {
				if(self.searchSanatoriiNow) {
					setTimeout(() => {
						const list2 = document.querySelector('ul.searched_list_elements');
						if(list2) {
							for(let i = 0; i < list2.children.length; i++) {
								let element = list2.children[i];
								if(element.innerText.indexOf('Чаборок') > -1 || element.innerText.indexOf('Дубровенка') > -1) {
									element.style.display = 'none';
									element.style.visibility = 'hidden';
								}
							}

							self.hideSanatorii();
						} else
							self.searchSanatoriiNow = false;
					}, 300);
				}
			},

			self.saveButton = function () {
				let leadStatusInit;
				const statusBtn = $("ul.pipeline-select__dropdown")
				if(statusBtn) {
					const el1 = document.getElementsByClassName("pipeline-select__dropdown__item_selected");
					if(el1 && el1.length > 0) {
						const ch = el1[0].getElementsByClassName("pipeline-select__item-text")
						if(ch && ch.length > 0) {
							leadStatusInit = ch[0].innerText;
						}
					}
				}

				const findBtn = $('#save_and_close_contacts_link')
				if(findBtn) {
					findBtn.on('click', function() {
						const el1 = document.getElementsByClassName("pipeline-select__dropdown__item_selected");
						if(el1 && el1.length > 0) {
							const ch = el1[0].getElementsByClassName("pipeline-select__item-text")
							if(ch && ch.length > 0) {
								const leadStatus = ch[0].innerText

								if((self.leadStatusInit === "Договор" || self.leadStatusInit === "Ожидаем оплату" || self.leadStatusInit === "Не все оплатил") && leadStatus === "Успешно реализовано") {
									var dogovorGenerated = false;
									const elNames = document.getElementsByClassName("diskGet-cell-name");
									if(elNames && elNames.length > 0) {
										for(var i = 0; i < elNames.length && !dogovorGenerated; i++) {
											const pdfDocName = elNames[i].innerText;
											const dogov = pdfDocName.indexOf('Договор') >= 0;
											if(dogov === true)
												dogovorGenerated = true;
										}
									}

									const generated = document.getElementsByName("CFV[796596]");
									if(generated && generated.length > 0)
										if(generated[0].value !== 'Да')
											generated[0].value = dogovorGenerated ? 'Да' : 'Нет';
								}

								// if(self.isAdmin() && leadStatus == "Закрыто и не реализовано") {
								// 	console.log('code: ' + AMOCRM.data.current_card.id + ' <' + leadStatus +'>'+ ' <' + leadStatusInit +'>' )
				//code: 26774384 <Закрыто и не реализовано> <Не все оплатил>
								// }

								if(self.errorStatus) {
									self.delayStatusCheck(true);
									return false;
								}
								
							}
						}

						// 467375 

					});
				}
			},

			self.convertButton = function () {
				$('textarea[name="CFV[376479]"]').parent().parent().append(self.renderButton('BYN->RUB', "convValButton")); //добавляем кнопку
				$('textarea[name="CFV[376479]"]').parent().parent().css("display", "flex");
				$('#convValButton').on('click', async function () { //вешаем событие на кнопку
					const dateOfDog = self.getDateContract().toLocaleDateString('ru');
					$('body').addClass('page-loading');

					if (!self.kursNBRB || self.kursNBRB.length == 0 || Date.parse(self.kursNBRB[0]["Date"]) != Date.parse(dateOfDog.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'))) {
						self.kursNBRB = await self.getCoursesNBRNOnDate(dateOfDog)
					}

					let curs = {};
					curs["nbrb"] = self.kursNBRB.filter(el => el["Cur_Abbreviation"] == "RUB")[0]["Cur_OfficialRate"];


					// if (!self.innerKurs.date || Date.parse(self.innerKurs.date.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')) != Date.parse(dateOfDog.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'))) {
						self.innerKurs = await self.getInnerCoursesOnDate()
						curs["inner"] = self.innerKurs["BYNRUB"]
					// }


					var data = '<div class="modal-body__inner"><span class="modal-body__close"><span class="icon icon-modal-close"></span></span><h2 class="modal-body__caption head_2">Из BYN в RUB</h2>' + //задаём модалку
						'<table style="width:100%"><tbody><tr>' +
						'<th>Введите сумму в BYN</th>' +
						'<th>' + self.renderInput('BYN', 'BYN', false) + '</th>' +
						'</tr>' +
						'<tr>' +
						'<td>Сумма в RUB для РФ</td>' +
						'<td>' + self.renderInput('RUB4RF', 'RUB4RF') + 
						// self.renderButton('Сохранить', "copyRUB4RF") + 
						'</td>' +

						'</tr>' +
						'<tr>' +
						'<td>Сумма в RUB для РБ</td>' +
						'<td>' + self.renderInput('RUB4RB', 'RUB4RB') + 
						// self.renderButton('Сохранить', "copyRUB4RB") + 
						'</td>' +
						'</tr>' +
						'</tbody></table>' +
						'</div>';
					self.addModal(data, '500px');//отрисовываем модалку
					$('#BYN').on('input', function () {
						$('#RUB4RF').val(($('#BYN').val() / curs["inner"] * 100).toFixed(2));
						$('#RUB4RB').val(($('#BYN').val() / curs["nbrb"] * 100).toFixed(2));
					});
					// $('#copyRUB4RF').click(function () {
					// 	$('input[name="CFV[305137]"]').val($('#RUB4RF').val()).change()

					// 	setTimeout(() => { AMOCRM.data.current_card.$save_btn.click(); }, 300);
					// 	$('.icon-modal-close').click();
					// });
					// $('#copyRUB4RB').click(function () {
					// 	$('input[name="CFV[305137]"]').val($('#RUB4RB').val()).change()

					// 	setTimeout(() => { AMOCRM.data.current_card.$save_btn.click(); }, 300);
					// 	$('.icon-modal-close').click();
					// });
					$('body').removeClass('page-loading');

				});
			},
			self.getCopiesLeads = function (phoneNumber) {
				return new Promise((resolve) => {
					const data = {}
					$.ajax({
						url: `https://${AMOCRM.widgets.system.domain}/ajax/v1/elements/list?term=${phoneNumber}&pipeline_id=1736272`,
						method: 'GET',
						data,
						success: (data) => {
							const result = (data.response?.items?.leads?.current_pipeline && typeof data.response.items.leads.current_pipeline != "undefined") ? data.response.items.leads.current_pipeline : []
							resolve(result)
						}
					})
				})
			},
			self.checkSuccessLeads = async function () {
				//собрали номера телефонов с контактов текущей сделки
				let collectionOfNumbers = [];
				AMOCRM.data.current_card.linked_forms.form_models.models.forEach((el) => {
					if (typeof (el.attributes) != "undefined") {
						if (el.attributes.ELEMENT_TYPE == 1) {
							for (const [key, value] of Object.entries(el.attributes)) {
								if (key.indexOf("CFV[183781]") != -1 && key.indexOf("[VALUE]") != -1) {
									collectionOfNumbers.push(value);
								}
							}
						}
					}
				})
				//Оставили только 9 цифр в номерах телефонов
				collectionOfNumbers = collectionOfNumbers.map(el => {
					const str = el.replace(/\D+/g, "")
					return str.substr(str.length - 9)
				})
				//Убрали повторы и строки длиной меньше чем 9 цифр
				collectionOfNumbers = collectionOfNumbers.filter((item, index) => collectionOfNumbers.indexOf(item) === index && item.length >= 9);
				//Собрали все сделки с полученными номерами телефонов
				const promises = collectionOfNumbers.map(async el => {
					return await self.getCopiesLeads(el)
				})
				//Фильтранули сделки по "Успешно реализовано"
				//const result = allLeads.filter(el => el.status.name == "Успешно реализовано")
				let leads = await Promise.all(promises)
				leads = [].concat.apply([], leads)
				const stringyLeads = leads.map(el => JSON.stringify(el))
				leads = leads.filter((el, ind) => stringyLeads.indexOf(JSON.stringify(el)) === ind && el.status.name == "Успешно реализовано" && el.id != AMOCRM.data.current_card.id)
				return leads
			},
			self.new2023Year = () => {
				const checkInValue = $('[name="CFV[305203]"]').val();
				const checkIn = new Date(checkInValue.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
				return checkIn && (checkIn >= new Date('01.01.2023'));
			}
			self.skipBNALTransfer = () => {
				const $transferField = $('[name="CFV[305137]"]');
				if(self.new2023Year()) {
					$transferField.val(0).change();
				}
			}
			self.isMiddleComission = (dv = self.valutes[$('input[name="CFV[305333]"]').val()]) => {
				const sanik = $('[name="CFV[305089]"]').val();
				if(["437473", "471121", "448619",
						"473989", "491889", "471283", 
						"497351", "537355", "467393",
						"486889", "464937", "501963",
						"468613", "530151", "486053",
						"490135", "473417", "452097",
						"729733", "795762", "783316",
						"515567", "453229", "474901", "730657", "471231"].includes(sanik)) return true;
				if(["448613", "448583", "454305", "448607", "448611"].includes(sanik) && dv == 'BYN') return true;
				if(["470671", "454245", "526229"].includes(sanik) && dv !== 'BYN') return true;
				return false;
			}
			self.isTenThirthyComission = (dv = self.valutes[$('input[name="CFV[305333]"]').val()]) => {
				const sanik = $('[name="CFV[305089]"]').val();
				if(["489531", "495425", "526229",
						"530549", "488835", "467375",
						"437473", "471121", "448619",
						"473989", "465811", "491889",
						"471283", "537355",
						"467393", "486889", "464937",
						"501963", "468613", "530151",
						"486053", "490135", "487115",
						"491887", "729733", "795762",
						"783316", "515567", "453229",
						"474901", "458451", "452097",
						"473417", "480065", "471231"].includes(sanik)) return true;
				if(["448613", "448583", "454305", "448607", "448611"].includes(sanik) && dv == 'BYN') return true;
				if(["470671", "454245", "526229"].includes(sanik) && dv !== 'BYN') return true;
				return false;
			}
			self.fetchComissions = async function(sum) {
				const response = await fetch('/api/v4/leads', {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify([{id: AMOCRM.data.current_card.id, custom_fields_values: [{field_id: 305091, values: [{value: sum}]}, {field_id: 305093, values: [{value: sum}]}]}])
				});
				const json = await response.json();
			}


			self.setAllComissions = async function (dv, already_client) {
				const sanik = () => $('[name="CFV[305089]"]').val();
				
				// Санаторий "Жемчужина"
				if(["471283"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiZhemchuzhina(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiZhemchuzhina(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Сосновый бор"
				if(["448611"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSosnovyibor(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSosnovyibor(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Радон"
				if(["448583"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiRadon(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiRadon(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Поречье"
				if(["448613"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiPoreche(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiPoreche(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Рассвет-Любань"
				if(["448607"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiRassvet_Liuban(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiRassvet_Liuban(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Белорусочка"
				if(["448585"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiBelorusochka(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiBelorusochka(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				//  Санаторий "Буг"
				if(["474331"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiBug(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiBug(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Берестье"
				if(["465157"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiBereste(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiBereste(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Боровое"
				if(["458451"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiBorovoe(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiBorovoe(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}



				// Санаторий "Белая Русь"
				if(["829120"].includes(sanik())) {
				  const price2 = self.get_price_kurort_SanatoriiBelajaRuss(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}



				
				// Оздоровительный центр "Веста"
				if(["450649"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_OzdorovitelnyitsentrVesta(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_OzdorovitelnyitsentrVesta(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Волма"
				if(["468613"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiVolma(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiVolma(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Золотые пески" 
				if(["471121"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiZolotyepeski(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiZolotyepeski(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Имени В.И. Ленина"
				if(["471189"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiImeniV_I_Lenina(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiImeniV_I_Lenina(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Ислочь" 
				if(["465029"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiIsloch(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiIsloch(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Оздоровительный центр "Ислочь-парк"
				if(["729733"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_OzdorovitelnyitsentrIsloch_park(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_OzdorovitelnyitsentrIsloch_park(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Криница"
				if(["467899"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiKrinitsa(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiKrinitsa(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Радуга"
				if(["454305"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiRaduga(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiRaduga(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Лесное"
				if(["515567"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiLesnoe(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiLesnoe(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Лесные озера"
				if(["469867"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiLesnyeozera(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiLesnyeozera(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Лётцы"
				if(["464911"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiLettsy(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiLettsy(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий Магистральный"
				if(["495425"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiMagistralnyi(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiMagistralnyi(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Машиностроитель"
				if(["453229"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiMashinostroitel(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiMashinostroitel(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Нарочанка"
				if(["462373"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiNarochanka(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiNarochanka(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Нарочь"
				if(["448617"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiNaroch(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiNaroch(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}

				// Санаторий "Нарочанский берег"
				if(["828878"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiNarochanskijBereg(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiNarochanskijBereg(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Нафтан"
				if(["796508"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiNaftan(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiNaftan(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Неман-72"
				if(["524831"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiNeman_72(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiNeman_72(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Пралеска" (Минская область)
				if(["448619"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiPraleska_Minskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiPraleska_Minskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Пралеска" (Гроднеская область)
				if(["497351"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiPraleska_Grodneskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiPraleska_Grodneskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Приднепровский"
				if(["464917"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiPridneprovskii(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiPridneprovskii(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Приморский"
				if(["437471"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiPrimorskii(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiPrimorskii(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Приозерный"
				if(["486053"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiPriozernyi(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiPriozernyi(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Рассвет имени К.П. Орловского"
				if(["467393"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiRassvetimeniK_P_Orlovskogo(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiRassvetimeniK_P_Orlovskogo(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Серебрянные ключи"
				if(["473989"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSerebriannyekliuchi(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSerebriannyekliuchi(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Солнечный"
				if(["783316"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSolnechnyi(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSolnechnyi(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Сосны" (Минская область)
				if(["473417"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSosny_Minskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSosny_Minskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Сосны (Гомельская область)
				if(["491889"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSosny_Gomelskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSosny_Gomelskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Спутник"
				if(["474901"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSputnik(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSputnik(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Альфа-Радон"
				if(["452101"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiAlfa_Radon(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiAlfa_Radon(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Ченки"
				if(["459521"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiChenki(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiChenki(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Энергетик" (Гродненская область)
				if(["454245"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiEnergetik_Grodnenskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiEnergetik_Grodnenskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Оздоровительный центр "Энергетик" (Минская область)
				if(["535149"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_OzdorovitelnyitsentrEnergetik_Minskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_OzdorovitelnyitsentrEnergetik_Minskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Оздоровительный центр "Энергия"
				if(["493445"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_OzdorovitelnyitsentrEnergiia(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_OzdorovitelnyitsentrEnergiia(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Юность"
				if(["452097"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiIunost(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiIunost(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Горнолыжный курорт "Силичи"
				if(["491887"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_GornolyzhnyikurortSilichi(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_GornolyzhnyikurortSilichi(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Ружанский"
				if(["469593"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiRuzhanskii(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiRuzhanskii(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Зеленый бор"
				if(["829052"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiZelenyibor(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiZelenyibor(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Сосны" (Могилевская область)
				if(["526229"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiSosny_Mogilevskaiaoblast_(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiSosny_Mogilevskaiaoblast_(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Лепельский военный санаторий Вооруженных сил РБ
				if(["828624"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_LepelskiivoennyisanatoriiVooruzhennykhsilRB(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_LepelskiivoennyisanatoriiVooruzhennykhsilRB(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}


								// Лепельский военный
				if(["467375"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_LepelskiivoennyisanatoriiVooruzhennykhsilRB(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_LepelskiivoennyisanatoriiVooruzhennykhsilRB(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Чаборок"
				if(["825974"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiChaborok(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiChaborok(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}
				
				// Санаторий "Озерный"
				if(["480065"].includes(sanik())) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiOzernyi(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiOzernyi(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}


								// Санаторий "Журавушка"
				if(["828722"].includes(sanik()) ) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiZhuravushka(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiZhuravushka(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}

								// Санаторий "Журавушк_"
				if(["475075"].includes(sanik()) ) {
				  if(dv === 'BYN' || dv !== 'RUB') {
				    const price1 = self.get_price_kurort_SanatoriiZhuravushka(dv === 'BYN', already_client, dv);
				    const sum = self.convertSumValDogInRUB(price1, 'BYN');
				    await self.fetchComissions(sum);
				    return true;
				  }
				  const price2 = self.get_price_kurort_SanatoriiZhuravushka(false, already_client, dv);
				  await self.fetchComissions(price2);
				  return true;
				}


				// get_price_kurort_SanatoriiZhuravushka


				const not_selected_sanik = 0;
				await self.fetchComissions(not_selected_sanik);

				return false;
			}






			self.setComissions = async function (dv = self.valutes[$('input[name="CFV[305333]"]').val()]) {
				console.log('загрузка.');
				const sanik = () => $('[name="CFV[305089]"]').val();
				const checkIn = () => new Date(AMOCRM.data.current_card.model.attributes['CFV[305203]'].replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
				
				const leads = await self.checkSuccessLeads();
				const already_client = leads.length > 0; // Если есть успешно реализованные сделки
				if(await self.setAllComissions(dv , already_client))
					return
				return

				// Жемчужина
				if(["471283"].includes(sanik())) {
					self.fixedComission.blockFieldController()
					if(dv == 'BYN') {
						const sum = self.convertSumValDogInRUB(5, dv);
						await self.fetchComissions(sum);
						return;
					}
					await self.fetchComissions(150);
					return;	
				}

				// Радон, Соновый бор - РФ 15%
				if(["448583", "448611"].includes(sanik()) && dv === 'RUB') {
					await self.fetchComissions(150);
					return;
				}
				
				if(self.isTenThirthyComission(dv) || 
					(["465157"].includes(sanik()) && ((checkIn().getMonth() === 11 && checkIn().getDate() >= 25) || (checkIn().getMonth() === 0 && checkIn().getDate() <= 7))) ||
					(["465157"].includes(sanik()) && ((checkIn().getMonth() === 5 && checkIn().getDate() >= 1) || (checkIn().getMonth() === 7 && checkIn().getDate() <= 15))) ||
					(["465157"].includes(sanik()) && ((checkIn().getMonth() >= 5 && checkIn().getMonth() <= 7)))
				) {
					self.fixedComission.blockFieldController();
					if(dv == 'BYN') {
						const sum = self.convertSumValDogInRUB(27, dv);
						await self.fetchComissions(sum);
						return;
					}
					await self.fetchComissions(1500);
					return;				
				}

				if(self.isMiddleComission(dv)) {
					self.fixedComission.blockFieldController()
					if(dv == 'BYN') {
						const sum = self.convertSumValDogInRUB(27, dv);
						await self.fetchComissions(sum);
						return;
					}
					await self.fetchComissions(1500);
						return;	
				}

				// Юность
				if(["452097"].includes(sanik()) && dv === 'RUB') {
					await self.fetchComissions(2250);
					return;
				}

				// Веста, Белоруочка, Берестье (РФ), 
				// ОЦ Энергетик, Дубровенка, Неман-72
				if(["450649", "448585", "465157", 
					"535149", "523253", "523253"].includes(sanik())) {
						if(dv == 'BYN') {
							const sum = self.convertSumValDogInRUB(5, dv);
							await self.fetchComissions(sum);
							return;
						}
						await self.fetchComissions(150);
						return;
				}

				if(["469593", "448615", "493445",
						"469867", "464911", "464917",
						"459521", "452101", "524831", 
						"523253", "471189", "448585", 
						"450649", "475075", "465029",
						"467899", "462373", "448617",
						"454201", "437471", "454245",
						"796508", "474331"].includes(sanik())) {
							if(dv == 'BYN') {
								const sum = self.convertSumValDogInRUB(5, dv);
								await self.fetchComissions(sum);
								return;
							}
							await self.fetchComissions(150);
								return;	

				}

				if(["448613", "448583", "454305", "448607", "448611"].includes(sanik()) && dv === 'RUB') {
					await self.fetchComissions(150);
						return;	

				}

				if(self.new2023Year()) {
					await self.fetchComissions(500);
					return;
				}

				if(!["480065", "491889",
						"509801", "730657", "486743", 
						"465811", "501963", "471231",
						"737047", "489531", "535173",
						"454245", "470671"].includes(sanik())) {
							await self.fetchComissions(150);
							return;	

				}

				if (self.fixedComission.isLowMarginSan() && !self.isAdmin()) {
					self.fixedComission.setComission()
					return
				}

				if (dv == "RUB") {
					await self.fetchComissions(150);
						return;	
				}

				if (dv == "BYN") {
					const sum = self.convertSumValDogInRUB(5, dv);
					await self.fetchComissions(sum);
					return
				}

				return
			},









self.get_price_kurort_SanatoriiZhemchuzhina = function(resident, already_client, dv) {
  const name_471283 = 'Санаторий "Жемчужина"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiSosnovyibor = function(resident, already_client, dv) {
  const name_448611 = 'Санаторий "Сосновый бор"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiRadon = function(resident, already_client, dv) {
  const name_448583 = 'Санаторий "Радон"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiPoreche = function(resident, already_client, dv) {
  const name_448613 = 'Санаторий "Поречье"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiRassvet_Liuban = function(resident, already_client, dv) {
  const name_448607 = 'Санаторий "Рассвет-Любань"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiBelorusochka = function(resident, already_client, dv) {
  const name_448585 = 'Санаторий "Белорусочка"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiBug = function(resident, already_client, dv) {
  const name_474331 = ' Санаторий "Буг"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiBereste = function(resident, already_client, dv) {
  const name_465157 = 'Санаторий "Берестье"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiBorovoe = function(resident, already_client, dv) {
  const name_458451 = 'Санаторий "Боровое"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},


self.get_price_kurort_SanatoriiBelajaRuss = function(resident, already_client, dv) {
  const name_829120 = 'Санаторий "Белая Русь"';
	if (!resident) {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		else if (dv === 'RUB')
			return already_client ? 750 : 1500;
	}
},





self.get_price_kurort_OzdorovitelnyitsentrVesta = function(resident, already_client, dv) {
  const name_450649 = 'Оздоровительный центр "Веста"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiVolma = function(resident, already_client, dv) {
  const name_468613 = 'Санаторий "Волма"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiZolotyepeski = function(resident, already_client, dv) {
  const name_471121 = 'Санаторий "Золотые пески" ';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiImeniV_I_Lenina = function(resident, already_client, dv) {
  const name_471189 = 'Санаторий "Имени В.И. Ленина"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiIsloch = function(resident, already_client, dv) {
  const name_465029 = 'Санаторий "Ислочь" ';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_OzdorovitelnyitsentrIsloch_park = function(resident, already_client, dv) {
  const name_729733 = 'Оздоровительный центр "Ислочь-парк"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiKrinitsa = function(resident, already_client, dv) {
  const name_467899 = 'Санаторий "Криница"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiRaduga = function(resident, already_client, dv) {
  const name_454305 = 'Санаторий "Радуга"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiLesnoe = function(resident, already_client, dv) {
  const name_515567 = 'Санаторий "Лесное"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiLesnyeozera = function(resident, already_client, dv) {
  const name_469867 = 'Санаторий "Лесные озера"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 2 : 4;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiLettsy = function(resident, already_client, dv) {
  const name_464911 = 'Санаторий "Лётцы"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiMagistralnyi = function(resident, already_client, dv) {
  const name_495425 = 'Санаторий Магистральный"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiMashinostroitel = function(resident, already_client, dv) {
  const name_453229 = 'Санаторий "Машиностроитель"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiNarochanka = function(resident, already_client, dv) {
  const name_462373 = 'Санаторий "Нарочанка"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiNaroch = function(resident, already_client, dv) {
  const name_448617 = 'Санаторий "Нарочь"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},


self.get_price_kurort_SanatoriiNarochanskijBereg = function(resident, already_client, dv) {
  const name_828878 = 'Санаторий "Нарочанский берег"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},


self.get_price_kurort_SanatoriiNaftan = function(resident, already_client, dv) {
  const name_796508 = 'Санаторий "Нафтан"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiNeman_72 = function(resident, already_client, dv) {
  const name_524831 = 'Санаторий "Неман-72"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiPraleska_Minskaiaoblast_ = function(resident, already_client, dv) {
  const name_448619 = 'Санаторий "Пралеска" (Минская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiPraleska_Grodneskaiaoblast_ = function(resident, already_client, dv) {
  const name_497351 = 'Санаторий "Пралеска" (Гроднеская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiPridneprovskii = function(resident, already_client, dv) {
  const name_464917 = 'Санаторий "Приднепровский"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiPrimorskii = function(resident, already_client, dv) {
  const name_437471 = 'Санаторий "Приморский"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		// return already_client ? 300 : 600;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiPriozernyi = function(resident, already_client, dv) {
  const name_486053 = 'Санаторий "Приозерный"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiRassvetimeniK_P_Orlovskogo = function(resident, already_client, dv) {
  const name_467393 = 'Санаторий "Рассвет имени К.П. Орловского"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiSerebriannyekliuchi = function(resident, already_client, dv) {
  const name_473989 = 'Санаторий "Серебрянные ключи"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiSolnechnyi = function(resident, already_client, dv) {
  const name_783316 = 'Санаторий "Солнечный"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiSosny_Minskaiaoblast_ = function(resident, already_client, dv) {
  const name_473417 = 'Санаторий "Сосны" (Минская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiSosny_Gomelskaiaoblast_ = function(resident, already_client, dv) {
  const name_491889 = 'Санаторий "Сосны (Гомельская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiSputnik = function(resident, already_client, dv) {
  const name_474901 = 'Санаторий "Спутник"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiAlfa_Radon = function(resident, already_client, dv) {
  const name_452101 = 'Санаторий "Альфа-Радон"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiChenki = function(resident, already_client, dv) {
  const name_459521 = 'Санаторий "Ченки"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiEnergetik_Grodnenskaiaoblast_ = function(resident, already_client, dv) {
  const name_454245 = 'Санаторий "Энергетик" (Гродненская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_OzdorovitelnyitsentrEnergetik_Minskaiaoblast_ = function(resident, already_client, dv) {
  const name_535149 = 'Оздоровительный центр "Энергетик" (Минская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_OzdorovitelnyitsentrEnergiia = function(resident, already_client, dv) {
  const name_493445 = 'Оздоровительный центр "Энергия"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiIunost = function(resident, already_client, dv) {
  const name_452097 = 'Санаторий "Юность"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_GornolyzhnyikurortSilichi = function(resident, already_client, dv) {
  const name_491887 = 'Горнолыжный курорт "Силичи"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiRuzhanskii = function(resident, already_client, dv) {
  const name_469593 = 'Санаторий "Ружанский"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiZelenyibor = function(resident, already_client, dv) {
  const name_530151 = 'Санаторий "Зеленый бор"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiSosny_Mogilevskaiaoblast_ = function(resident, already_client, dv) {
  const name_526229 = 'Санаторий "Сосны" (Могилевская область)';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_LepelskiivoennyisanatoriiVooruzhennykhsilRB = function(resident, already_client, dv) {
  const name_467375 = 'Лепельский военный санаторий Вооруженных сил РБ';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiChaborok = function(resident, already_client, dv) {
  const name_825974 = 'Санаторий "Чаборок"';
	if (resident && dv === 'BYN')
		return already_client ? 6 : 12;
	else {
		if (dv === 'EUR')
			return already_client ? 3 : 6;
		else if (dv === 'USD')
			return already_client ? 3 : 6;
		return already_client ? 300 : 600;
	}
},

self.get_price_kurort_SanatoriiOzernyi = function(resident, already_client, dv) {
  const name_480065 = 'Санаторий "Озерный"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},

self.get_price_kurort_SanatoriiZhuravushka = function(resident, already_client, dv) {
  const name_480065 = 'Санаторий "Журавушка"';
	if (resident && dv === 'BYN')
		return already_client ? 14 : 27;
	else {
		if (dv === 'EUR')
			return already_client ? 8 : 16;
		else if (dv === 'USD')
			return already_client ? 8 : 16;
		return already_client ? 750 : 1500;
	}
},
			
			self.fixedComission = {
				san: $('[name="CFV[305089]"]'),
				checkIn: $('[name="CFV[305203]"]'),
				settings: {
					sanIds: [
						{
							ids: ["491889", "737047", "535173", "480065", "486743", "730657"],
							tourService: { "RUB": 725, "BYN": 25, "USD": 10, "EUR": 8 },
							infoService: { "RUB": 725, "BYN": 25, "USD": 10, "EUR": 8 },
						},	
						// {
						// 	ids: ["491889", "737047", "535173", "480065", "486743", "730657"],
						// 	tourService: { "RUB": 725, "BYN": 25, "USD": 10, "EUR": 8 },
						// 	infoService: { "RUB": 725, "BYN": 25, "USD": 10, "EUR": 8 },
						// },	
						// {
						// 	ids: ["491889", "737047", "535173", "480065", "486743", "730657"],
						// 	tourService: { "RUB": 725, "BYN": 25, "USD": 10, "EUR": 8 },
						// 	infoService: { "RUB": 725, "BYN": 25, "USD": 10, "EUR": 8 },
						// },
						// {
						// 	ids: ["452097", "471283", "453229",
						// 				"454245", "468613", "489531",
						// 				"486053", "467393", "537355",
						// 				"464937", "526229", "490135",
						// 				"487115", "486889", "530549",
						// 				"497351", "501963", "530151",
						// 				"491887", "437473",
						// 				"471121", "729733", "467375",
						// 				"458451", "473989", "488835",
						// 				"473417", "495425"],
						// 	tourService: { "RUB": 210, "BYN": 7, "USD": 3, "EUR": 2 },
						// 	infoService: { "RUB": 210, "BYN": 7, "USD": 3, "EUR": 2 },
						// },
						// {
						// 	ids:["474901"],
						// 	tourService: {"RUB": 230,  "BYN": 8, "USD": 3, "EUR": 2 }
						// },
						// {
						// 	ids: ["450649", "448585", "452101"],
						// 	tourService: { "RUB": 30, "BYN": 1, "USD": 1, "EUR": 1 },
						// 	infoService: { "RUB": 30, "BYN": 1, "USD": 1, "EUR": 1 },
						// }
					]
				},
				sanatoriesIds: function () {
					return this.settings.sanIds.reduce((prev, current) => {
						const currentArray = current.ids.map((el) => {
							return el
						})
						return [...prev, ...currentArray]
					}, [])
				},
				findSan(id) {
					for (let i = 0; i < this.settings.sanIds.length; i++) {
						let group = this.settings.sanIds[i]
						if (group.ids.includes(id)) {
							return {
								id,
								tourService: group.tourService,
								infoService: group.infoService,
							}
						}
					}
					return null
				},
				isLowMarginSan: function () {
					return this.sanatoriesIds().includes(this.san.val())
				},
				blockFieldController() {
					self.blockFields.block_field($('[name="CFV[305091]"]'));
					self.blockFields.block_field($('[name="CFV[305093]"]'));
					return;

					if (this.isLowMarginSan() || self.isCentrKurort() || self.isMiddleComission() || self.isTenThirthyComission()) {
						self.blockFields.block_field($('[name="CFV[305091]"]'))
						self.blockFields.block_field($('[name="CFV[305093]"]'))
					} else {
						self.blockFields.unblock_field($('[name="CFV[305091]"]'))
						self.blockFields.unblock_field($('[name="CFV[305093]"]'))
					}
					if(self.new2023Year()) {
						self.blockFields.block_field($('[name="CFV[305137]"]'));
					} else {
						self.blockFields.unblock_field($('[name="CFV[305137]"]'));
					}
				},
				setComission() {
					const currentValCode = self.getCurrentValutaCode();
					const comissions = this.findSan(this.san.val());

					if (!currentValCode) return;

					const tourService = self.convertSumValDogInRUB(comissions.tourService[currentValCode], currentValCode);
					const infoService = self.convertSumValDogInRUB(comissions.infoService[currentValCode], currentValCode);

					self.fetchComissions(tourService);
					// $('[name="CFV[305091]"]').val(tourService).change();
					// $('[name="CFV[305093]"]').val(infoService).change();
				},
				onChangeFunction(event) {
					// const prevValue = event.target.dataset.prevValue;
					// const currentValue = event.target.value;
					// if(prevValue != currentValue) {
						const it = self.fixedComission;
						self.setComissions();
						self.skipBNALTransfer();
						// if (it.isLowMarginSan()) it.setComission()
						it.blockFieldController();
					// }
				},
				init() {
					APP.data.current_card.model.on('change', (model) => {
						if(	model.changed['lead[STATUS]'] === '26081356' || // при статусе договор
							!!model.changed['CFV[305089]'] || // при смене санатория
							!!model.changed['CFV[305203]']) { // при смене даты заезда
							this.onChangeFunction();
						}
					});
					// this.san.on('change', this.onChangeFunction);
					// this.checkIn.on('change', this.onChangeFunction);
					this.blockFieldController();
				},
			},
			self.blockFields = {
				falsyFunction() {
					return false;
				},
				stopFunction(event) {
					event.stopImmediatePropagation();
					return false;
				},
				block_field(field) {
					if (field.closest('.linked-form__field-pei').length > 0) {
						field.on('keydown paste cut', this.falsyFunction);
						return;
					}
					if (field.siblings('.control--select--button').length) {
						field.siblings('.control--select--button').on('click', this.falsyFunction);
					}
					if (field.parents('.date_field_wrapper').length) {
						field.parents('.date_field_wrapper').on('click', this.falsyFunction)
							.find('.date_field_wrapper--calendar').on('click', this.falsyFunction);
					}
					if (field.parents('.control-address__wrapper').length) {
						field.parents('.control-address__wrapper').on('click', this.falsyFunction);
					}
					field.on('keydown keyup keypress paste cut mousedown mouseup click focusin focusout focus blur', this.stopFunction)
						.parents('.linked-form__field')
						.find('.linked-form__field__label')
						.addClass('linked-form__field__label_disabled');
				},
				unblock_field(field) {
					if (field.closest('.linked-form__field-pei').length > 0) {
						field.unbind('keydown paste cut', this.falsyFunction);
						return;
					}
					if (field.siblings('.control--select--button').length) {
						field.siblings('.control--select--button').unbind('click', this.falsyFunction);
					}
					if (field.parents('.date_field_wrapper').length) {
						field.parents('.date_field_wrapper').unbind('click', this.falsyFunction)
							.find('.date_field_wrapper--calendar').unbind('click', this.falsyFunction);
					}
					if (field.parents('.control-address__wrapper').length) {
						field.parents('.control-address__wrapper').unbind('click', this.falsyFunction);
					}
					field.unbind('keydown keyup keypress paste cut mousedown mouseup click focusin focusout focus blur', this.stopFunction)
						.parents('.linked-form__field')
						.find('.linked-form__field__label')
						.removeClass('linked-form__field__label_disabled');
				}
			},
			self.advancedSettings = {
				makeTable: () => {
					return `
						<table class="changeInnerCourses" border="3">
							<thead>
								<tr>
									<th>Дата</th>
									<th>BYN -> RUB</th>
									<th>RUB -> BYN</th>
									<th>BYN -> EUR</th>
									<th>EUR -> BYN</th>
									<th>BYN -> USD</th>
									<th>USD -> BYN</th>
									<th>RUB -> EUR</th>
									<th>EUR -> RUB</th>
									<th>RUB -> USD</th>
									<th>USD -> RUB</th>
									<th>EUR -> USD</th>
									<th>USD -> EUR</th>					
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>26.05.2022</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
									<td contenteditable='true'>23.23</td>
								</tr>
								<tr>
									<td>25.05.2022</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
									<td contenteditable='true'>11.22</td>
								</tr>
							</tbody>
						</table>
					`
				},
				addCss: (url) => {
					const now = Date.now();
					if ($('link[href*="'+url+'"]').length < 1) {
				$("head").append('<link href="'+url+'?'+now+'" type="text/css" rel="stylesheet">');
			}
				},
				removeCss: (url) => {
					$('link[href*="'+url+'"]').remove();
				},
				loadScript: function(url, callback) {
					const script = document.createElement( "script" )
					if(script.readyState) {  // only required for IE <9
						script.onreadystatechange = function() {
							if ( script.readyState === "loaded" || script.readyState === "complete" ) {
								script.onreadystatechange = null;
								callback();
							}
						};
					} else {  //Others
						script.onload = function() {
							callback();
						};
					}

					script.src = url;
					document.getElementsByTagName("head")[0].appendChild(script);
				},
				removeScript: (url) => {
					$('script[src*="'+url+'"]').remove();
				},
				templates: {
					table: `
						<div>
							<div class='action_button_wrapper'>
								<button type="button" class="button-input button-input_add button-input_blue" @click="onSave">
									<span class="button-input-inner ">
										<span class="button-input-inner__text">Сохранить</span>
									</span>
								</button>
								<button type="button" class="button-input" @click="onRefresh">
									<span class="button-input-inner ">
										<span class="button-input-inner__text">Обновить</span>
									</span>
								</button>
							</div>
							<table class="changeInnerCourses" border="3">
								<thead>
									<tr>
										<th>Дата</th>
										<th v-for="(item, key) in tableHeaders" :key="key">{{item}}</th>				
									</tr>
								</thead>
								<tbody>
									<tr v-for="row in tableData" :key="row.id" :data-row-id="row.id">
										<td>{{new Date(row.date).toLocaleDateString()}}</td>
										<td v-for="(item, key) in tableHeaders" :key="key" :data-cell-id="item">
											<input style="coursesCell" v-model.number="row[item]" type="number" step="0.0001"/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					`,
				},
				vueScript: () => {
					const { createApp } = Vue;
					document
						.getElementById('list_page_holder')
						.insertAdjacentHTML('beforeend', self.advancedSettings.templates.table);
					createApp({
						data() {
							return {
								tableData: [],
								tableHeaders: []
							}
						},
						methods: {
							async updateInnerCourses() {
								document.body.classList.add('page-loading');
								const currentDate = new Date();
								currentDate.setDate(currentDate.getDate() + 1);
								const tomorrow = currentDate.toLocaleDateString();
								currentDate.setDate(currentDate.getDate() - 3);
								const lastWeek = currentDate.toLocaleDateString();
								const response = await fetch('https://wg.belkurort.by/widget/price/getInnerCoursesByDateRangeFromDB.php', {
									method: 'POST',
									body: JSON.stringify({hash: self.hash, dateFrom: lastWeek, dateTo: tomorrow})
								});
								this.tableData = await response.json();
								this.tableHeaders = this.tableData.reduce((acc, day) => {
									Object
										.keys(day)
										.filter(el => !["id", "date"].includes(el))
										.forEach(el => {
											if(!acc.includes(el)) acc.push(el)
										})
									return acc
								}, []);
								document.body.classList.remove('page-loading');
							},
							async onSave() {
								try {
									const result = await fetch('https://wg.belkurort.by/widget/price/setInnerCoursesRange.php', {
										method: 'POST',
										body: JSON.stringify({hash: self.hash, range: JSON.stringify(this.tableData)})
									});
									const json = await result.json();
									if(json.result) {
										alert("Курсы успешно обновлены");
									}								
								} catch (error) {
									alert('Непредвиденная ошибка. Детали в консоли.')
								}
							},
							async onRefresh() {
								this.updateInnerCourses();
							}
						},
						mounted() {
							this.updateInnerCourses();
						}
					}).mount('#list_page_holder')
				}
			},
			this.callbacks = {
				render: function () {
					if (location.pathname.indexOf('/leads/detail/') != -1) {
						//				if([3406348].indexOf(AMOCRM.widgets.system.amouser_id) != -1) {
						self.render_template({
							caption: {
								class_name: 'price_get' //имя класса для обертки разметки
							},
							body: '', //разметка
							render: '<link type="text/css" rel="stylesheet" href="https://wg.belkurort.by/widget/price/widget.css" ><div>' +
								// self.renderButton("Просчитать цену на путёвку", 'MathPrice') +
								'</div><div style="padding-top: 5px;">' +
								self.renderButton("Перевести бел руб в рос руб", 'MathCurs') +
								'</div>'
						});
						// $('#MathPrice').on('click', () => {
						// 	var data = '<iframe src="https://bron.zdravkurort.by/resorts/rates/calculate" width="1000" height="700" align="center"></iframe>';
						// 	self.addModal(data, '1065px');
						// });
						$('#MathCurs').on('click', () => {
							var data = '<iframe src="https://wg.belkurort.by/widget/price/calculate.html" width="450" height="150" align="center"></iframe>';
							self.addModal(data, '500px');
						});
						//			}

					}
					return true;
				},
				init: function () {
					return true;
				},
				bind_actions: async function () {
					if(APP.data.current_entity !== 'leads') return true;
					self.convertButton()	// кнопка конвертирования валют		

					self.initLeadStatusInit() // взять начальный статус
					self.dogovorGenerationCheck() // проверить наличие договора в 'Генерация'
					self.openingChannelCheck() // проверить из какого канал открыта сделка
					self.saveButton()	// кнопка сохранения
					self.foundationComboBox()	// кнопка выбора санатория
					self.statusOptionsBlock() // смена статуса сделки

					if (!self.isAdmin()) {
						self.fixedComission.init()
					}

					self.currency.convertRubInValDog();
					//////////////////////////////////////////////////Конвертирование и отображение валют
					// const arrayConvertFieldsId = [305095, 305091, 305093, 305169, 305337, 305139, 372377, 305137, 362303, 305363, 305359, 370933, 381911, 396460, 758042]
					// arrayConvertFieldsId.forEach(e => self.renderConvertField(e)) 
					self.converter.init();
					// try {
					// 	//забираем курсы НБРБ
					// 	self.kursNBRB = await self.getCoursesNBRNOnDate();
					// 	//обновляем значения
					// 	arrayConvertFieldsId.forEach(async el => {
					// 			const convertedValue = await self.currency.printConvertedValue(el);
					// 			//пишем просчитанные значения
					// 			// $('#' + el + '-convert-field').text(`${Math.round(self.convertRUBinValDog(el)).toLocaleString('ru')} ${self.getCurrentValutaCode()}`)
					// 			$('#' + el + '-convert-field').text(`${convertedValue} ${self.getCurrentValutaCode()}`)
					// 			//ставим триггер на изменение значений при изменении полей
					// 			$('input[name="CFV[' + el + ']"]').change(() => {
					// 				setTimeout(function () {
					// 					// $('#' + el + '-convert-field').text(`${Math.round(self.convertRUBinValDog(el)).toLocaleString('ru')} ${self.getCurrentValutaCode()}`)
					// 					$('#' + el + '-convert-field').text(`${convertedValue} ${self.getCurrentValutaCode()}`)
					// 				}, 100)
					// 			})
					// 	});
						//ставим триггер на изменение значений при изменении валюты
						$('input[name="CFV[305333]"]').change((e) => {
								$('body').addClass('page-loading');
								const dv = self.valutes[e.target.value]
								// arrayConvertFieldsId.forEach(async el => { //отрисовываем новые курсы
								// 	const convertedValue = await self.currency.printConvertedValue(el);
								// 	// $('#' + el + '-convert-field').text(`${Math.round(self.convertRUBinValDog(el)).toLocaleString('ru')} ${dv}`)
								// 	$('#' + el + '-convert-field').text(`${convertedValue} ${dv}`)
								// })
								const dogDate = self.getDateContract().toLocaleDateString();
								if (Date.parse(dogDate.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')) >= 1599598800 || dogDate == "") {
									const prom = self.setComissions(dv)
									prom.then(() => {
										AMOCRM.data.current_card.save()
									}).finally(() => {
										$('body').removeClass('page-loading');
									})
								}
						});

						//ставим триггер на пересчёт комиссий, если изменился санаторий
						$('input[name="CFV[305333]"]').change((e) => {
							self.setComissions()
							self.skipBNALTransfer();
						});

						//ставим триггер на пересчёт комиссий, если изменился туроператор (ЦК) или дата заезда
						$('input[name="CFV[339925]"], input[name="CFV[305203]"]').change((event) => {
								const prevValue = event.target.dataset.prevValue;
								const currentValue = event.target.value
								if(prevValue != currentValue) {
									self.setComissions()
									self.skipBNALTransfer()
								}
						});
					// } catch {
					// 		arrayConvertFieldsId.forEach(el => {
					// 			$('#' + el + '-convert-field').text(`ошибка`)
					// 		})
					// }
					return true;
				},
				advancedSettings: function () {
					// const $header = $('.list__body-right__top');
					// const saveBtn = self.renderButton('Сохранить', 'saveBtn', 'button-input_blue');
					// const cancelBtn = self.renderButton('Обновить', 'refreshBtn');

					// $header.css({'display': 'flex', 'justify-content': 'space-between'});
					// $header.append(`<div style='display:flex;'>${saveBtn}${cancelBtn}</div>`);

					self.advancedSettings.addCss(self.cssUrl);
					self.advancedSettings.loadScript(self.vueUrl, self.advancedSettings.vueScript);
				},
				settings: function () {
					return true;
				},
				onSave: function () {
					return true;
				},
				destroy: function () {
					self.advancedSettings.removeCss(self.cssUrl);
					self.advancedSettings.removeScript(self.vueUrl);
				},

			};
		return this;
	};
});
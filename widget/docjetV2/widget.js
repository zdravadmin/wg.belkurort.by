var CustomWidget = function () {
	var self = this;
	self.url_parametres = "";
	self.amouser_id = AMOCRM.widgets.system.amouser_id;
	self.dogstatus = ['26081356', '28291732', '26726761', '142'];
	self.showdog = [3406348, 3504832, 3449320, 12335137];
	self.putevkausers = [3449311, 3504832, 3406348, 3449308, 3449320, 12335137];
	self.card_info = {};
	self.validFields = [305285, 305195, 305287, 305337, 305333, 305091, 305093, 305095, 305203, 305205, 305323, 313885, 305179, 313133, 339925];
	self.modalData = function (t, flag) {
		let tex = '<div class="modal-body__inner" style="text-align: center;"><span class="modal-body__close"><span class="icon icon-modal-close"></span></span><span class="modal-body__close"><span class="icon icon-modal-close"></span></span>';
		if (flag == true) {
			tex += '<div class="modal-body__inner__success"><span class="icon icon-inline icon-modal-success"></span></div><h2 class="modal-body__caption head_2">';
		}
		tex += t + '</h2><div class="modal-body__actions "><button type="button" class="button-input   js-modal-accept js-button-with-loader modal-body__actions__save " tabindex="1" id="conformSendInfo"><span class="button-input-inner "><span class="button-input-inner__text">Окей</span></span></button></div></div>';
		return tex;
	},
		self.IsJsonString = function (str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		}
	self.getRequest = function (url, type) {
		var prom = new Promise(function (resolve, reject) {
			$('body').addClass('page-loading');
			self.crm_post(url,
				{},
				function (msg) {
					obj = JSON.parse(JSON.stringify(msg));
					if (obj.error == false) {
						resolve("result");
					} else {
						reject("error");
					}
				},
				'json'
			);
		});
		prom.then(
			result => {
				self.addModal(self.modalData(type + " отправлена!", true));
				$('body').removeClass('page-loading');
			},
			error => {
				self.addModal(self.modalData("Не удалось отправить " + type + ". Повторите ещё раз!", false));
				$('body').removeClass('page-loading');
			});
	},
		self.addModal = function (data) { //функция добавляет модальное окно в dom
			modal = new Modal({
				class_name: 'modal-window',
				init: function ($modal_body) {
					var $this = $(this);
					$modal_body
						.trigger('modal:loaded') // запускает отображение модального окна
						.html(data)
						.trigger('modal:centrify')
						.append('');
					$("#conformSendInfo").on("click", () => {
						$(".modal-scroller").click();
						//location.reload();
					});
				},
				destroy: function () { }
			});
		},
		self.validationFields = function (card_id, fields_array) {
			$.ajax({
				url: location.protocol + '//' + location.hostname + '/private/api/v2/json/leads/list?id=' + card_id,
				dataType: 'json',
				data: '',
				async: false,
				success: function (data) {
					$.each(data['response']['leads'][0]['custom_fields'], function (index, value) {
						fields_array = fields_array.filter(function (item) {
							return item != value['id'];
						});
					});

					$.ajax({
						url: location.protocol + '//' + location.hostname + '/api/v2/account?with=custom_fields',
						dataType: 'json',
						data: '',
						async: false,
						success: function (cf) {
							fields_array = fields_array.map(function (n) {
								return cf['_embedded']['custom_fields']['leads'][n]['name'];
							});
							fields_array = fields_array.join('\n');
						}
					});
				}
			});
			return fields_array;
		},
		self.renderButton = function (text, id) {
			return self.render({
				ref: '/tmpl/controls/button.twig'
			}, {
				text,
				class_name: 'subs_w',
				id: `print_button_dog${id}`
			})
		}


	this.callbacks = {
		render: function () {
			//устанавливаем цвет обложки этому виджету
			setTimeout(function () {
				$("div[class*='print_widget']").css('backgroundColor', '#76b4d5');
				$("div[class*='new_widget']").css('backgroundColor', '#f8fffe');
			}, 10);

			var print_button_dog1 = self.renderButton(".docx", 1)
			var print_button_dog11 = self.renderButton(".pdf", 11)
			var print_button_dog111 = self.renderButton("Просмотр", 111)

			var print_button_dog2 = self.renderButton(".docx", 2)
			var print_button_dog21 = self.renderButton("Просмотр", 21)
			var print_button_dog211 = self.renderButton("Отправить", 211)

			var print_button_dog3 = self.renderButton(".docx", 3)
			var print_button_dog31 = self.renderButton(".pdf", 31)
			var print_button_dog311 = self.renderButton("Просмотр", 311)

			var print_button_dog4 = self.renderButton(".docx", 4)
			var print_button_dog41 = self.renderButton("Просмотр", 41)
			var print_button_dog411 = self.renderButton("Отправить", 411)

			var print_button_dog5 = self.renderButton(".docx", 5)
			var print_button_dog51 = self.renderButton(".pdf", 51)
			var print_button_dog511 = self.renderButton("Просмотр", 511)

			var print_button_dog6 = self.renderButton(".docx", 6)
			var print_button_dog61 = self.renderButton(".pdf", 61)
			var print_button_dog611 = self.renderButton("Просмотр", 611)

			var print_button_dog7 = self.renderButton(".docx", 7)
			var print_button_dog71 = self.renderButton(".pdf", 71)
			var print_button_dog711 = self.renderButton("Просмотр", 711)

			var print_button_dog8 = self.renderButton("перенос и доплата", 8)
			var print_button_dog81 = self.renderButton("возврат", 81)
			var print_button_dog82 = self.renderButton("бесценный перенос", 82)
			var print_button_dog83 = self.renderButton("COVID", 83)
			var print_button_dog84 = self.renderButton("возврат РБ", 84)
			var print_button_dog85 = self.renderButton("Возврат часть", 85)

			var print_button_dog91 = self.renderButton("Просмотр", 91)
			var print_button_dog912 = self.renderButton("Отправить", 912)

			var html_data = `
			<link type="text/css" rel="stylesheet" href="/upl/zdravkyrort_widget_docs_print_else/widget/widget.css" >
				<div id="print_button_dog">
					<div class="line-button">Договор<br/>`;
			if (self.showdog.indexOf(self.amouser_id) != -1) {
				html_data += print_button_dog1
			}
			html_data += print_button_dog11
			if (self.showdog.indexOf(self.amouser_id) != -1) {
				html_data += print_button_dog111
			}
			html_data += '</div>';
			html_data += '<div class="line-button">' +
				"<br/>Договор 0,5" +
				"<br/>";
			if (self.showdog.indexOf(self.amouser_id) != -1) {
				html_data += print_button_dog6
			}
			html_data += print_button_dog61
			if (self.showdog.indexOf(self.amouser_id) != -1) {
				html_data += print_button_dog611
			}
			html_data += '</div>';
			html_data += '<div class="line-button">' +
				"<br/>Счёт к договору 0,5" +
				"<br/>";
			if (self.showdog.indexOf(self.amouser_id) != -1) {
				html_data += print_button_dog7
			}
			html_data += print_button_dog71

			if (self.showdog.indexOf(self.amouser_id) != -1) {
				html_data += print_button_dog711
			}
			html_data += '</div>';
			html_data += '<div class="line-button">' +
				"<br/>Заявка на бронирование" +
				"<br/>" + print_button_dog21 + print_button_dog211 +
				'</div>' +
				'<div class="line-button">' +
				"<br/>Аннуляция" +
				"<br/>" + print_button_dog41 + print_button_dog411 +
				'</div>';
			html_data += '<div class="line-button">' +
				"<br/>Корректировка к заявке" +
				"<br/>" + print_button_dog91 + print_button_dog912 +
				'</div>';
			if (self.putevkausers.indexOf(self.amouser_id) != -1) {
				html_data += '<div class="line-button">' +
					"<br/>Путевка" +
					"<br/>" + print_button_dog3 + print_button_dog31 + print_button_dog311 + '</div>';
			}
			html_data += '<div class="line-button">' +
				"<br/>Акт" +
				"<br/>" + print_button_dog5 + print_button_dog51 + print_button_dog511 +
				'</div>';

			if (self.putevkausers.indexOf(self.amouser_id) != -1) {
				html_data += '<div class="line-button">' +
					"<br/>Доп соглашение" +
					"<br/>" + print_button_dog8 + print_button_dog81 + print_button_dog84 + print_button_dog82 + print_button_dog83 + print_button_dog85 + '</div>';
			};
			html_data += '</div>';
			self.render_template({
				caption: {
					class_name: 'print_widget' //имя класса для обертки разметки
				},
				body: '', //разметка
				render: html_data //шаблон не передается
			});

			return true;
		},
		init: function () {
			return true;
		},
		bind_actions: function () {
			$('#print_button_dog1').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
				var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog1';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if (self.dogstatus.indexOf(leadstat) == -1) {
					alert("Переведите сделку в статус Договор!!!");
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});
			$('#print_button_dog11').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
				var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog11';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if (self.dogstatus.indexOf(leadstat) == -1) {
					alert("Переведите сделку в статус Договор!!!");
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});
			$('#print_button_dog111').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
				var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog111';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if (self.dogstatus.indexOf(leadstat) == -1) {
					alert("Переведите сделку в статус Договор!!!");
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});
			$('#print_button_dog2').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
				var doc = 'dog2';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});
			$('#print_button_dog21').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
				var doc = 'dog21';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				console.log(count);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}

			});
			$('#print_button_dog211').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
				var doc = 'dog212';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				var datein = new Date($('input[name="CFV[305203]"]').val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
				var datenow = new Date();
				datenow.setDate(datenow.getDate() + 17);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('input[name="CFV[339925]"]').val() == "493015" && datenow > datein && self.amouser_id != 3406348) {
					alert("Нельзя отправлять заявку в ЦК менее чем за 17 дней до заезда!!!");
				} else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;

					self.getRequest(link, "Заявка на бронирование");
				}
			});

			if (self.putevkausers.indexOf(self.amouser_id) != -1) {
				$('#print_button_dog3').on('click', function () {
					AMOCRM.data.current_card.save();
					var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog3';
					if (self.system().area === 'ccard') {
						var card_type = 'client';
					}
					if (self.system().area === 'lcard') {
						var card_type = 'lead';
					}
					var count = self.validationFields(card_id, self.validFields);
					if (count.length > 0) {
						alert("Не заполнены поля сделки\n" + count);
					}
					else {
						var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
						window.open(link);
					}

				});
				$('#print_button_dog31').on('click', function () {
					AMOCRM.data.current_card.save();
					var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog31';
					if (self.system().area === 'ccard') {
						var card_type = 'client';
					}
					if (self.system().area === 'lcard') {
						var card_type = 'lead';
					}
					var count = self.validationFields(card_id, self.validFields);
					if (count.length > 0) {
						alert("Не заполнены поля сделки\n" + count);
					}
					else {
						var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
						window.open(link);
					}

				});
				$('#print_button_dog311').on('click', function () {
					AMOCRM.data.current_card.save();
					var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog311';
					if (self.system().area === 'ccard') {
						var card_type = 'client';
					}
					if (self.system().area === 'lcard') {
						var card_type = 'lead';
					}

					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				});
			};

			$('#print_button_dog4').on('click', function () {
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog4';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}

			});
			$('#print_button_dog41').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog41';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}

			});
			$('#print_button_dog411').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog412';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}

				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					self.getRequest(link, "аннуляция");
				}
			});

			$('#print_button_dog5, #print_button_dog51, #print_button_dog511').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = $(this)[0]['id'].split("_")[2];
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}

				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
					//setTimeout(function() {location.reload();}, 5000);
				}
			});
			$('#print_button_dog6, #print_button_dog61, #print_button_dog611').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = $(this)[0]['id'].split("_")[2];
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				self.validFields.push(372377);
				var count = self.validationFields(card_id, self.validFields);
				self.validFields.pop();
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if (self.dogstatus.indexOf(leadstat) == -1) {
					alert("Переведите сделку в статус Договор!!!");
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
					//setTimeout(function() {location.reload();}, 5000);
				}
			});
			$('#print_button_dog7, #print_button_dog71, #print_button_dog711').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = $(this)[0]['id'].split("_")[2];
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				self.validFields.push(372377, 305359, 305361);
				var count = self.validationFields(card_id, self.validFields);
				self.validFields.pop(); self.validFields.pop(); self.validFields.pop();
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
					//setTimeout(function() {location.reload();}, 5000);
				}
			});
			$('#print_button_dog8').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog8';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});

			$('#print_button_dog81').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog81';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779") {
					alert("С беларусами работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});

			$('#print_button_dog84').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog84';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779") {
					alert("С беларусами работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});

			$('#print_button_dog82').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog82';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779") {
					alert("С беларусами работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});
			$('#print_button_dog83').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog83';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779") {
					alert("С беларусами работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});

			$('#print_button_dog85').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var leadstat = AMOCRM.data.current_card.model.defaults['lead[STATUS]'];
				var doc = 'dog85';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && [18005796, 19232588].indexOf(AMOCRM.data.current_card.id) == -1) {
					alert("Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'");
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}
			});

			$('#print_button_dog91').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog91';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				console.log(count);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				}
				else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					window.open(link);
				}

			});
			$('#print_button_dog912').on('click', function () {
				AMOCRM.data.current_card.save();
				var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id; var doc = 'dog912';
				if (self.system().area === 'ccard') {
					var card_type = 'client';
				}
				if (self.system().area === 'lcard') {
					var card_type = 'lead';
				}
				var count = self.validationFields(card_id, self.validFields);
				var datein = new Date($('input[name="CFV[305203]"]').val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
				var datenow = new Date();
				datenow.setDate(datenow.getDate() + 17);
				if (count.length > 0) {
					alert("Не заполнены поля сделки\n" + count);
				} else {
					var link = self.params.script_url + "?card_id=" + card_id + "&card_type=" + card_type + "&doc=" + doc + "&userid=" + self.amouser_id;
					self.getRequest(link, "Корректировка заявки");
				}
			});

			$('#print_button_dog').append(`<style>.subs_w{padding: 2px 8px; margin-right: 7px; margin-left: 0px !important; margin-top: 3px; border: 1px solid #138ff5; border-radius: 8px; color: #333333; cursor: pointer; font-size: 12px; opacity: 0.6; background-color: white;}</style>`)
			return true;
		},
		settings: function () {
			return true;
		},
		onSave: function () {
			return true;
		},
		destroy: function () {

		},
		contacts: {
			selected: function () {
			}
		},
		leads: {
			selected: function () {
			}
		},
		tasks: {
			selected: function () {
			}
		}
	};
	return this;
};
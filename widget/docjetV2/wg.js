define(['jquery','lib/components/base/modal'], function($, Modal) {
var CustomWidget = function () {
  var self = this
  const TOKEN = 'nYK4dxa{bFQoQEEq%AibWTrW'
  const BOSS_GROUP = 237814
  const SALES_MANAGERS_GROUP = 0
  const CLIENTS_MANAGERS_GROUP = 239857
  const ACCOUNTANT_GROUP = 236062
  const BUYERS_GROUP = 256606
  self.userId = APP.constant('user').id
  self.currentUser = APP.constant("managers")[self.userId]
  //  self.groups = AMOCRM.constant("groups")
  self.clienticsManagers = [3449311, 3449308, 7100445, 7974150]
  self.showdog = [3406348, 3504832, 3449320, 9567381, 12335137]
  self.validFields = [305089, 305285, 305195, 305287, 305337, 305333, 305091, 305093, 305095, 305203, 305205, 305323, 313885, 305139, 305179, 313133, 339925]
  self.validFieldsForRequest = [305089, 305195, 305337, 305333, 305091, 305093, 305095, 305203, 305205, 305323, 313885, 305139, 305179, 313133, 339925]
  self.putevkausers = [3449311, 3504832, 3406348, 3449308, 3449320, 12335137, 9567381, 7100445, 7974150]
  self.intervalsIds = []
  self.currentStatusId = (AMOCRM.data.current_card?.model?.defaults) ? AMOCRM.data.current_card.model.defaults['lead[STATUS]'] : 0
  // model.defaults — снимок на момент загрузки, живой статус в model.attributes
  self.getStatusId = function () {
    const model = AMOCRM.data.current_card?.model
    const status = model?.attributes?.['lead[STATUS]'] || model?.defaults?.['lead[STATUS]']
    return (status === undefined || status === null) ? '' : String(status)
  },
  self.getPiplineId = function () {
      return AMOCRM.data.current_card.model.defaults['lead[PIPELINE_ID]']
    },
  self.getCFV = function(CFid) {
    return $(`[name="CFV[${CFid}]"]`).val()
  },
  self.up2 = function(month) {
    const param = '' + month
    if(param.length() < 2)
      return '0' + param
    return param
  },
  self.isShowDog = () => self.showdog.includes(self.userId),
  self.isKvota = () => (APP.data.current_card.model?.defaults['CFV[351975]'] !== ''),
  self.middleware = {
      checkTypeReservation: function ({card_id}) {
        return new Promise((resolve) => {
          const mailBTN = self.render({
              ref: '/tmpl/controls/button.twig'
          }, {
              text: 'Выслать бронь на почту',
              id: "email_confirm_btn",
              class_name: ""
          });
          const vetlivaBTN = self.render({
              ref: '/tmpl/controls/button.twig'
          }, {
              text: 'Бронировать через Vetliva',
              id: "vetliva_confirm_btn",
              class_name: "button-input_blue"
          });
          const modal = `<div class="modal-body__inner">
                          <span class="modal-body__close">
                            <span class="icon icon-modal-close"></span>
                          </span>
                          <h2 class="modal-body__caption head_2">Как будем бронировать?</h2>
                          <p>Вы пытаетесь бронировать через туроператора ЦeнтрКурорт. Можно бронировать как письмом на почту, так и через платформу Vetliva. Как Вы планируете сделать данное бронирование?</p>
                          <div class="modal-body__actions">
                          ${mailBTN}
                          ${vetlivaBTN}
                          </div>
                        </div>`;
          
          self.addModal(modal)
          $('#email_confirm_btn').click(() => {
            $('.modal-scroller').click()
            resolve('email')
          })
          $('#vetliva_confirm_btn').click(() => {
            $('.modal-scroller').click()

            const bookInput = self.render({
                ref: '/tmpl/controls/input.twig'
            }, {
                id: 'vetliva-book-number',
                name: 'bookingNumber',
                style: {margin: '8px 0 0'},
                placeholder: 'Например: BEL200290P',
                value: ''
            });

            const saveBook = self.render({
                ref: '/tmpl/controls/button.twig'
            }, {
                text: 'Сохранить',
                id: "vetliva_save_btn",
                class_name: "button-input_blue"
            });

            const modal = `<div class="modal-body__inner">
                            <span class="modal-body__close">
                              <span class="icon icon-modal-close"></span>
                            </span>
                            <h2 class="modal-body__caption head_2">Введите номер бронирования</h2>
                            <p>Перейдите на сайт <a href="https://vetliva.ru" target="_blank">Vetliva.ru</a> и совершите необходимое бронирование. Получив номер брони, вставьте его в поле ниже и нажмите кнопку "Сохранить".</p>
                            ${bookInput}
                            <div class="modal-body__actions">
                            ${saveBook}
                            </div>
                          </div>`;

            self.addModal(modal)

            $('#vetliva-book-number').change((event) => {
              const val = event.target.value
              if(val.split(' ').length > 1) {
                alert('Пожалуйста, введите ТОЛЬКО номер бронирования. БЕЗ каких либо ещё слов. Например: BEL200290P')
                event.target.value = ''
              }
            })

            $('#vetliva_save_btn').click(async () => {
              const bookingNumber = $('#vetliva-book-number').val()
              if(!bookingNumber) {
                alert('Заполните номер бронирования!')
                return
              }
              $('.modal-scroller').click()
              $('body').addClass('page-loading');
              try {
                const response = await fetch('https://wg.belkurort.by/widget/docjetV2/vetliva/book.php', {
                  method: 'POST',
                  body: JSON.stringify({
                                        bookingNumber,
                                        leadId: card_id,
                                        foundationId: self.getCFV('305089')
                                      }),
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': TOKEN
                  }
                });
                const json = await response.json();

                if(!!json['error']) {
                  self.addModal(self.modalData(json['message'], false));
                } else {
                  self.addModal(self.modalData(json['message'], true));
                  resolve('vetliva')
                }

              } catch (error) {
                self.addModal(self.modalData('Что-то пошло не так. Пожалуйста, повторите попытку', false));
              } finally {
                $('.page-loading').removeClass('page-loading');
              }
            })

          })
        })
      }
  },
  self.validationFunctions = {
      hasEmptyCFForRequest: function () {
        const emptyFields = self.validFieldsForRequest.filter(fieldId => !AMOCRM.data.current_card.model.defaults[`CFV[${fieldId}]`])
        if (emptyFields.length != 0) {
          const emptyFieldsNames = emptyFields.map(el => {
            return document.querySelector(`[name="CFV[${el}]"]`).closest('.linked-form__field').querySelector('.linked-form__field__label').innerText.trim()
          })
          alert(`Заполните поля сделки:\n${emptyFieldsNames.join('\n')}`)
          return false
        }
        return true
      },
      hasEmptyCF: function () {
        const emptyFields = self.validFields.filter(fieldId => !AMOCRM.data.current_card.model.defaults[`CFV[${fieldId}]`])
        if (emptyFields.length != 0) {
          const emptyFieldsNames = emptyFields.map(el => {
            return document.querySelector(`[name="CFV[${el}]"]`).closest('.linked-form__field').querySelector('.linked-form__field__label').innerText.trim()
          })
          alert(`Заполните поля сделки:\n${emptyFieldsNames.join('\n')}`)
          return false
        }
        return true
      },
      mainPersonIsBelarus: function () {
        if ($('#guestlist').children(":first-child").find("span.nationality").text() == "РБ" && 
            AMOCRM.data.current_card.model.attributes['CFV[305333]'] != "437779" && 
            [26607576, 27165826, 27172116].indexOf(AMOCRM.data.current_card.id) == -1) {
          alert(`Гость на которого оформляем договор беларус, а с ними работаем только в бел руб! Смените валюту во вкладке 'Цена'`)
          //return false
          return true
        }
        return true
      },
      stopCK: function () {
        if ($('[name="CFV[339925]"]').val() === '493015') {
          alert(`Нельзя отправлять заявки в ЦК с 03.12.2021`)
          return false
        }
        return true
      },
      stopSanik: function () {
        if(['486743'].includes($('[name="CFV[305089]"]').val()) && ![23532958].includes(AMOCRM.data.current_card.id)) {
          alert(`Не работаем с санаторием ${$('[name="CFV[305089]"]').parent().find('button span')[0].innerText.trim()}`)
          return false;
        }
        // if (['486053', '473417', '458451'].includes($('[name="CFV[305089]"]').val()) && $('[name="CFV[305333]"]').val() == '437777' && ![22492500, 23088334, 23579382, 22480180, 17060772, 23602524, 23644342, 23654798, 23776830, 23776182, 23792302].includes(AMOCRM.data.current_card.id) && ![3406348, 3504832].includes(self.userId)) {
        //   alert(`Не работаем с санаторием ${$('[name="CFV[305089]"]').parent().find('button span')[0].innerText.trim()} в рос руб`)
        //   return false;
        // }
        return true;
      },
      isNewYear: function() {
        const $checkIn = $('[name="CFV[305203]"]');
			  const $checkOut = $('[name="CFV[305205]"]');
        const checkInYear = new Date($checkIn.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')).getFullYear();
        const checkOutYear = new Date($checkOut.val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')).getFullYear();
        // if((checkInYear < checkOutYear) && !self.getCFV(762124)) {
        //   alert('Заполните поле "Новогодний банкет на вкладке цена"');
        //   return false;
        // }
        return true
      },
      isContractStatus: function () {
        if (![26081356, 28291732, 26726761, 142].includes(Number(self.getStatusId())) && ![3406348].includes(self.userId)) {
          alert(`Для генерации договора переведите сделку в статус договора`)
          return false
        }
        return true
      },
      isCKandDaysIsOff: function () {
        const allowedLeadsIds = [22480180, 23510944, 23448968, 23105860, 22985310, 21072792, 13704841, 21711990, 21434710, 21967012, 22005340, 22060332, 22075876, 22076760, 22134042, 22154308, 22179928, 22179968, 22251448, 22446958, 22470250, 22594544, 22594902, 22618292, 22685408, 23281038, 23395126, 23393744, 23393750, 23490616, 23818386];
        let datein = new Date($('input[name="CFV[305203]"]').val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
        let datenow = new Date();
        datenow.setDate(datenow.getDate() + 6)

        if($('input[name="CFV[339925]"]').val() == "493015" && datenow > datein && self.userId != 3406348 && !allowedLeadsIds.includes(AMOCRM.data.current_card.id)) {
          alert("Нельзя отправлять заявку в ЦК менее чем за 6 дней до заезда!!!")
          return false
        }
        return true
      },
      isVetlivaBook: function() {
        if(/vetliva/.test($('[name="CFV[305351]"]').val())) {
          self.addModal(self.modalData(`Бронирование по этой сделке сделано через сайт Vetliva.by. Все корректировки и аннуляция происходит в <a href="${$('[name="CFV[305351]"]').val()}" target="_blank">карточке брони</a> на сайте Vetliva.by.`, false));
          return false
        }
        return true
      },
      isNewDogovorNotPrepared: function () {
        let dateDog = new Date($('input[name="CFV[305287]"]').val().replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));
        let datenow = new Date('2023/02/16');
        if(datenow.getTime() > dateDog.getTime()) return true;
        alert("C 16 февраля мы поменяли наш основной договор. А форму этого документа ещё не поменяли.");
        return false;
      }
  },
    self.showRules = {
      byStatuses: (statusesIdArr = []) => statusesIdArr.includes(Number(self.getStatusId())),
      byNotStatuses: (statusesIdArr = []) => !self.showRules.byStatuses(statusesIdArr),
      byUsers: (usersIdArr = []) => usersIdArr.includes(self.userId),
      byNotUsers: (usersIdArr = []) => !self.showRules.byUsers(usersIdArr),
      byPiplines: (piplinesIdArr = []) => piplinesIdArr.includes(Number(self.getPiplineId())),
      byNotPiplines: (piplinesIdArr = []) => !self.showRules.byPiplines(piplinesIdArr),
      byGroupId: (groupIds) => groupIds.map(el => `group_${el}`).includes(self.currentUser.group),
      byNotGroupId: (groupsIds) => !self.showRules.byGroupId(groupsIds),
      byGroupAndStatus: (groupsIds, statusesIds) => (self.showRules.byGroupId(groupsIds) && self.showRules.byStatuses(statusesIds)),
      byGroupAndNotStatus: (groupsIds, statusesIds) => (self.showRules.byGroupId(groupsIds) && self.showRules.byNotStatuses(statusesIds)),
      byGroupAndPipelines: (groupsIds, pipelineIds) => (self.showRules.byGroupId(groupsIds) && self.showRules.byPiplines(pipelineIds)),
      isKvota: () => self.isKvota(),
    },
    self.carry = function (callback, arglist) {
      const thisObj = this;
      return (function () {
        return callback.apply(thisObj, arglist)
      });
    },
    self.docsObjects = [
      {
        id: 1,
        title: "Договор",
        validate: [
                  self.validationFunctions.hasEmptyCF,
                  self.validationFunctions.isContractStatus,
                  self.validationFunctions.mainPersonIsBelarus,
                  self.validationFunctions.stopSanik
                ],
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[SALES_MANAGERS_GROUP], [26081356, 28291732, 26726761]]),
                    self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP], [142, 26726761, 28291732, 26081356]]),
                    self.carry(self.showRules.byGroupAndStatus, [[ACCOUNTANT_GROUP], [142, 26726761, 26081356, 28291732]]),
                    self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
                    self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
                    self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142, 26726761]]),
                    self.carry(self.showRules.byUsers, [[3943501], [142]]),
                    self.carry(self.showRules.byUsers, [[3449308]])
                  ],
        buttons: function () {
          let array = [];
          // if(self.isShowDog() || self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP])) {
          //   array.push(self.renderButton("Для печати", '_st_contract', 'doc-print'))
          // }
          (self.isShowDog() || self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP])) && array.push(self.renderButton(".docx", '_st_contract', 'doc'))
          array.push(self.renderButton(".pdf", '_st_contract', 'pdf'))
          if (self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP, BUYERS_GROUP]) || self.isShowDog()) {
            array.push(self.renderButton("Просмотр", '_st_contract', 'see'))
            array.push(self.renderButton("Для печати", '_st_contract', 'doc-print'))
          }
          self.isShowDog() && array.push(self.renderButton("Обновить данные по договору", 13, 'actualize'))
          return array
        }
      },
      {
        id: 6,
        title: "Договор 0,5",
        validate: [
          self.validationFunctions.hasEmptyCF,
          self.validationFunctions.isContractStatus,
          self.validationFunctions.mainPersonIsBelarus,
          self.validationFunctions.stopSanik,
          self.validationFunctions.isNewDogovorNotPrepared
        ],
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[SALES_MANAGERS_GROUP], [26081356, 28291732, 26726761]]),
        self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP], [142, 26726761, 28291732, 26081356]]),
        self.carry(self.showRules.byGroupAndStatus, [[ACCOUNTANT_GROUP], [142, 26726761, 26081356, 28291732]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142, 26726761]]),
        self.carry(self.showRules.byUsers, [[3449308]])],
        buttons: function () {
          let array = [];
          (self.isShowDog() || self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP])) && array.push(self.renderButton(".docx", '_st_contract', 'doc'))
          array.push(self.renderButton(".pdf", '_st_contract', 'pdf'))
          if (self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP, BUYERS_GROUP]) || self.isShowDog()) {
            array.push(self.renderButton("Просмотр", '_st_contract', 'see'))
          }
          self.isShowDog() && array.push(self.renderButton("Обновить данные по договору", 13, 'actualize'))
          return array
        }
      },
      {
        id: 7,
        title: "Счёт к договору 0,5",
        validate: [self.validationFunctions.hasEmptyCF,
        self.validationFunctions.isContractStatus,
        self.validationFunctions.mainPersonIsBelarus,
        self.validationFunctions.stopSanik,
        self.validationFunctions.isNewDogovorNotPrepared],
        showOnPiplines: [1736272],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[SALES_MANAGERS_GROUP], [26726761, 26726761]]),
        self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP], [142, 26726761, 28291732, 26081356]]),
        self.carry(self.showRules.byGroupAndStatus, [[ACCOUNTANT_GROUP], [142, 26726761, 26081356, 28291732]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        self.carry(self.showRules.byUsers, [[3449308]])],
        buttons: function () {
          let array = [];
          (self.isShowDog() || self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP])) && array.push(self.renderButton(".docx", '_st_contract', 'doc'))
          array.push(self.renderButton(".pdf", '_st_contract', 'pdf'))
          self.isShowDog() && array.push(self.renderButton("Просмотр", '_st_contract', 'see'))
          return array
        }
      },
      {
        id: 2,
        title: "Заявка на бронирование",
        validate: [ self.validationFunctions.hasEmptyCFForRequest,
                    self.validationFunctions.isCKandDaysIsOff,
                    self.validationFunctions.stopSanik,
                    self.validationFunctions.isNewYear],
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[SALES_MANAGERS_GROUP], [26081347, 26081350, 26081353, 26726761, 26081356, 28291732]]),
        self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26726761, 26081353]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142]])],
        buttons: function () {
          let buttons = [self.renderButton("Просмотр", 1, 'see')];
          if(!self.isKvota() || self.showRules.byStatuses([142]) || self.showRules.byGroupId([BOSS_GROUP])) {
            buttons.push(self.renderButton("Отправить", 12, 'send'));
          }
          if (self.isShowDog() || self.showRules.byGroupId([CLIENTS_MANAGERS_GROUP])) {
            buttons.push(self.renderButton("Обновить данные по заявке", 13, 'actualize'))
          }
          return buttons
        }
      },
      {
        id: 9,
        title: "Корректировка к заявке",
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[SALES_MANAGERS_GROUP], [26081353, 26081356, 28291732, 26726761]]),
        self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26726761]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        // self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142]]),
        self.carry(self.showRules.byUsers, [[3449308]])],
        validate: [ self.validationFunctions.hasEmptyCFForRequest, 
                    self.validationFunctions.isVetlivaBook,
                    self.validationFunctions.isNewYear,
                    self.validationFunctions.stopSanik],
        buttons: function () {
          let buttons = [self.renderButton("Просмотр", 1, 'see')];
          if(!self.isKvota() || self.showRules.byStatuses([142]) || self.showRules.byGroupId([BOSS_GROUP])) {
            buttons.push(self.renderButton("Отправить", 12, 'send'));
          }
          return buttons
        }
      },
      {
        id: 0,
        title: "Доп инфо к заявке",
        validate: [ self.validationFunctions.isVetlivaBook,
                    self.validationFunctions.isNewYear,
                    self.validationFunctions.stopSanik],
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26726761]]),
                  self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
                  self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP], [3836187]])],
        buttons: function () {
          const buttons = [self.renderButton("Посмотреть", "see")];
          if(!self.isKvota() || self.showRules.byStatuses([142])) {
            buttons.push(self.renderButton("Отправить", 12, 'send'));
          }
          return buttons
        }
      },
      {
        id: 4,
        title: "Аннуляция",
        validate: [ self.validationFunctions.hasEmptyCFForRequest,
                    self.validationFunctions.isVetlivaBook],
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[SALES_MANAGERS_GROUP], [26081347, 26081350, 26081353, 26081356, 28291732, 143]]),
        self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26081356, 26726761, 143]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142]])],
        buttons: function () {
          const buttons = [self.renderButton("Просмотр", 1, "see")];
          buttons.push(self.renderButton("Отправить", 12, 'send'));
          return buttons;
        }
      },
      {
        id: 3,
        title: "Путёвка",
        validate: [self.validationFunctions.hasEmptyCF],
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26726761, 26081356]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142]])],
        buttons: function () {
          const array = [];
          if(self.isShowDog()) {
            array.push(self.renderButton("Для печати", 'doc', 'doc-print'))
          }
          array.push(self.renderButton(".docx", 'doc', 'doc'),
          self.renderButton(".pdf", 1, 'pdf'),
          self.renderButton("Просмотр", 11, 'see'));
          return array;
        }
      },
      {
        id: 5,
        title: "Акт",
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26726761]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]])],
        validate: [self.validationFunctions.hasEmptyCF, self.validationFunctions.mainPersonIsBelarus],
        buttons: function () {
          return [
            self.renderButton(".docx", "_st_contract", 'doc'),
            self.renderButton(".pdf", "_st_contract", 'pdf'),
            self.renderButton("Просмотр", "_st_contract", 'see')
          ]
        }
      },
      {
        id: 8,
        title: "Доп соглашение",
        showOnPiplines: [1736272, 3836187],
        showRules: [self.carry(self.showRules.byGroupAndStatus, [[CLIENTS_MANAGERS_GROUP, ACCOUNTANT_GROUP], [142, 26726761]]),
        self.carry(self.showRules.byGroupAndNotStatus, [[BOSS_GROUP], []]),
        self.carry(self.showRules.byGroupAndPipelines, [[CLIENTS_MANAGERS_GROUP], [3836187]]),
        self.carry(self.showRules.byGroupAndStatus, [[BUYERS_GROUP], [142, 26726761]])],
        validate: [
          self.validationFunctions.hasEmptyCF, 
          self.validationFunctions.mainPersonIsBelarus,
        ],
        buttons: function () {
          return [
            self.renderButton("перенос и доплата", 1, 'perenos_i_doplata'),
            self.renderButton("расторжение", 1, 'vozvrat'),
            self.renderButton("бесценный перенос", 1, 'perenos_bez_cen'),
            // self.renderButton("COVID", 1, 'covid'),
            // self.renderButton("расторжение РБ", 1, 'vozvrat_rb'),
            self.renderButton("частичный возврат", 1, 'vozvrat_part')
          ]
        }
      }
    ],
    self.renderButton = function (text, id, buttonType = 'pdf', openNewWindow = true) {
      return self.render({
        ref: '/tmpl/controls/button.twig'
      }, {
        text,
        class_name: 'docget_subs_w',
        id: `docget_button_dog${id}${Math.floor(Math.random() * 50)}`,
        additional_data: `data-docget-button-type=${buttonType} data-docget-id=${id} data-docget-open-new-window=${openNewWindow}`
      })
    },
    self.makeLines = function () {
      return self.docsObjects.map(el => {
        if (!el.showRules || el.showRules.some(ruleFunction => ruleFunction() === true)) return self.makeTableLine(el.id, el.title, el.buttons)
        return
      }).join("")
    },
    self.makeTableLine = function (id, header, buttons) {
      return `<div class="docget_line_button" data-doc-id=${id}>
                  ${header}<br/>
                  ${buttons().join("")}
             </div>`
    },
    self.updateLines = function () {
      const docsArea = document.querySelector('#docget_docs_area')
      if (!!docsArea) {
        docsArea.innerHTML = self.makeLines()
      }
    },
    self.startValidation = function (functionsArr) {
      return functionsArr.every(func => func())
    },
    self.clickHandler = async function (event) {
      const btn = event.target.closest('button')
      const docId = btn.closest('[data-doc-id]').dataset.docId
      if (btn) {
        let buttonId = btn.dataset.docgetId
        let buttonType = btn.dataset.docgetButtonType
        let userId = self.userId;
        const docObj = self.docsObjects.find(document => document.id == docId)
        var card_id = (AMOCRM.data.current_card.getPipelineId() == 3836187 && self.IsJsonString(AMOCRM.data.current_card.model.attributes["CFV[398102]"])) ? JSON.parse(AMOCRM.data.current_card.model.attributes["CFV[398102]"])[0] : AMOCRM.data.current_card.id;
        
        if (self.getPiplineId() != 3836187 && 
            docObj.validate && 
            !self.startValidation(docObj.validate)) return

        if(self.getCFV('339925') == '493015' && docId == 2 && buttonId == 12) {
          const a = await self.middleware.checkTypeReservation({card_id})
          if(a == 'vetliva') return
        }

        AMOCRM.data.current_card.changes.has_changes && AMOCRM.data.current_card.save()
        
        const docFile = (['5', '6','7'].includes(docId)) ? `dog1${buttonId}` : (['8'].includes(docId)) ? `dog${docId}` : `dog${docId}${buttonId}`;

        if(buttonType === 'doc-print') {
          buttonType = 'doc';
          userId = APP.data.current_card.model.attributes['lead[MAIN_USER]'];
        }

        const link = `https://wg.belkurort.by/widget/docjetV2/AMO_Script.php?card_id=${card_id}&card_type=lead&doc=${docFile}&userid=${userId}&docType=${docObj.id}&buttonType=${buttonType}`

        if (btn.dataset.docgetOpenNewWindow == "true") {
          window.open(link)
        } else {
          self.getRequest(link, docObj.title)
        }
        if(['2'].includes(docId)) {
          setTimeout(() => $(document).trigger("page:reload"), 3000);
        }
      }
    },
    self.getRequest = function (url, type) {
      var prom = new Promise(function (resolve, reject) {
        $('body').addClass('page-loading');
        $.ajax({
          url,
          method: 'POST',
          data: {},
          success: function (msg) {
            obj = JSON.parse(msg);
            if (obj.error == false) {
              resolve("result");
            } else {
              reject("error");
            }
          },
          error: function () {
            reject("error");
          }
        });
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
    self.modalData = function (t, flag) {
      let tex = '<div class="modal-body__inner" style="text-align: center;"><span class="modal-body__close"><span class="icon icon-modal-close"></span></span><span class="modal-body__close"><span class="icon icon-modal-close"></span></span>';
      if (flag == true) {
        tex += '<div class="modal-body__inner__success"><span class="icon icon-inline icon-modal-success"></span></div><h2 class="modal-body__caption head_2">';
      }
      tex += t + '</h2><div class="modal-body__actions "><button type="button" class="button-input   js-modal-accept js-button-with-loader modal-body__actions__save " tabindex="1" id="conformSendInfo"><span class="button-input-inner "><span class="button-input-inner__text">Окей</span></span></button></div></div>';
      return tex;
    },
    self.ajax = function (url, method = "GET", headers = {}, data = '') {
      return new Promise(resolve => {
        $.ajax({
          url: `https://${AMOCRM.widgets.system.domain}${url}`,
          method: method,
          headers: headers,
          data: data,
          success: (data) => { resolve(data) }
        });
      });
    },
    self.addModal = function (data) {
      modal = new Modal({
        class_name: 'modal-window',
        init: function ($modal_body) {
          var $this = $(this);
          $modal_body
            .trigger('modal:loaded')
            .html(data)
            .trigger('modal:centrify')
            .append('');
          $("#conformSendInfo").on("click", () => {
            $(".modal-scroller").click();
          });
        },
        destroy: function () { }
      });
    },
    self.statusChecker = function () {
      // if (self.currentStatusId == self.getStatusId()) return
      self.updateLines()
      self.fields.controller()
      self.currentStatusId = self.getStatusId()
    },
    self.statusPoller = function () {
      if (self.currentStatusId == self.getStatusId()) return
      self.statusChecker()
    },
    self.IsJsonString = function (str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    }
  self.fields = {
    controller() {
      if (this.coundition()) this.block_fields()
      if (this.notCoundition()) this.unblock_fields()
    },
    coundition() {
      return (["142"].includes(self.getStatusId()) && `group_${SALES_MANAGERS_GROUP}` == self.currentUser.group)
    },
    notCoundition() {
      return (["142"].includes(self.currentStatusId) && !["142"].includes(self.getStatusId()) && `group_${SALES_MANAGERS_GROUP}` == self.currentUser.group)
    },
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
    block_fields() {
      const it = this
      $('[name^="CFV"]:not([data-type="email"])').each(function () {
        it.block_field($(this))
      })
      $('textarea[name="lead[NAME]"]').attr('disabled', true);
      $('.fr_resp_name').remove();
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
    },
    unblock_fields() {
      const it = this
      $('[name^="CFV"]').each(function () {
        it.unblock_field($(this))
      })
      $('textarea[name="lead[NAME]"]').attr('disabled', false);
    }
  }
  this.callbacks = {
    render: function () {
      if (AMOCRM.widgets.system.area == "lcard") {
        self.render_template({
          caption: {
            class_name: 'docget' //имя класса для обертки разметки
          },
          body: `<link type="text/css" rel="stylesheet" href="https://wg.belkurort.by/widget/docjetV2/widget.css?v=1" >
                <div id="docget_docs_area">
                </div>`,
          render: ``
        })
        self.updateLines()
        self.fields.controller()
      }
      return true;
    },
    init: function () {
      return true;
    },
    bind_actions: function () {
      if (AMOCRM.widgets.system.area == "lcard") {
        document.getElementById('docget_docs_area').addEventListener("click", self.clickHandler);
        APP.data.current_card.model?.on('change', (model) => {
          if(model.changed['lead[STATUS]'] || model.changed[`CFV[351975]`] !== undefined) {
            self.statusChecker();
          }
        })
        const intervalId = setInterval(self.statusPoller, 5000);
        self.intervalsIds.push(intervalId)
      }
      return true;
    },
    settings: function () {
      return true;
    },
    onSave: function () {
      return true;
    },
    destroy: function () {
      if (AMOCRM.widgets.system.area == "lcard") {
        if (document.getElementById('docget_docs_area')) document.getElementById('docget_docs_area').removeEventListener("click", self.clickHandler)
        self.intervalsIds.forEach(id => {
          clearInterval(id)
        })
      }
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
}
return CustomWidget;
});

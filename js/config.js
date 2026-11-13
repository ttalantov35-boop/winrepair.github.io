/* ==========================================================
   НАСТРОЙКИ САЙТА — меняйте только этот файл
   ========================================================== */
window.SITE_CONFIG = {
  // GitHub: владелец и имя репозитория программы
  github: {
    owner: 'ttalantov35-boop',          // ваш логин на GitHub
    repo: 'winrepair'        // имя репозитория
  },

  // Как распознать файлы в релизе (по части имени, без учёта регистра).
  // Например: winrepair-x64.exe и winrepair-x86.exe.
  // Если в релизе один .exe — он будет считаться 64-битным.
  assets: {
    x64: ['WinRepair_x64.exe'],
    x86: ['WinRepair_x86.exe']
  },

  // Контакты (оставьте пустым, чтобы скрыть строку)
  contacts: {
    author: 'Tynychsoft',
    email: '',                       // например: me@example.com
    telegram: ''                     // например: my_nick (без @)
  },

  // Комментарии Giscus: значения берутся на https://giscus.app
  giscus: {
    repo: '',                        // 'your-username/winrepair-toolkit'
    repoId: '',                      // 'R_kgDO...'
    category: 'General',
    categoryId: ''                   // 'DIC_kwDO...'
  },

  // Форма обратной связи: адрес Formspree (https://formspree.io).
  // Если пусто — форма откроет почтовую программу с готовым письмом.
  formEndpoint: ''
};

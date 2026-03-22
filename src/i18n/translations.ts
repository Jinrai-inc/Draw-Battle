export type Language = 'ja' | 'en' | 'zh' | 'ko' | 'es';

export const LANGUAGE_LABELS: Record<Language, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  es: 'Español',
};

const translations = {
  // ===== Common =====
  back: { ja: '戻る', en: 'Back', zh: '返回', ko: '뒤로', es: 'Volver' },
  error: { ja: 'エラー', en: 'Error', zh: '错误', ko: '오류', es: 'Error' },
  ok: { ja: 'OK', en: 'OK', zh: '确定', ko: '확인', es: 'Aceptar' },
  cancel: { ja: 'キャンセル', en: 'Cancel', zh: '取消', ko: '취소', es: 'Cancelar' },
  settings: { ja: '設定', en: 'Settings', zh: '设置', ko: '설정', es: 'Ajustes' },
  language: { ja: '言語', en: 'Language', zh: '语言', ko: '언어', es: 'Idioma' },

  // ===== Tabs =====
  tab_home: { ja: 'ホーム', en: 'HOME', zh: '首页', ko: '홈', es: 'INICIO' },
  tab_draw: { ja: 'お絵描き', en: 'DRAW', zh: '绘画', ko: '그리기', es: 'DIBUJAR' },
  tab_battle: { ja: 'バトル', en: 'BATTLE', zh: '对战', ko: '배틀', es: 'BATALLA' },
  tab_collection: { ja: 'コレクション', en: 'COLLECTION', zh: '收藏', ko: '컬렉션', es: 'COLECCIÓN' },
  tab_social: { ja: 'ソーシャル', en: 'SOCIAL', zh: '社交', ko: '소셜', es: 'SOCIAL' },

  // ===== Login =====
  login_google: { ja: 'Googleでログイン', en: 'Sign in with Google', zh: '使用Google登录', ko: 'Google로 로그인', es: 'Iniciar sesión con Google' },
  login_apple: { ja: 'Appleでログイン', en: 'Sign in with Apple', zh: '使用Apple登录', ko: 'Apple로 로그인', es: 'Iniciar sesión con Apple' },
  login_email: { ja: 'メールで登録 / ログイン', en: 'Sign up / Sign in with Email', zh: '邮箱注册/登录', ko: '이메일로 가입/로그인', es: 'Registrarse / Iniciar con Email' },
  login_guest: { ja: 'ゲストではじめる', en: 'Play as Guest', zh: '游客模式', ko: '게스트로 시작', es: 'Jugar como invitado' },
  login_guest_note: { ja: '※ログインなしですぐ遊べます', en: '※Play instantly without signing in', zh: '※无需登录即可游玩', ko: '※로그인 없이 바로 플레이', es: '※Juega al instante sin registrarte' },
  login_or: { ja: 'または', en: 'or', zh: '或者', ko: '또는', es: 'o' },
  login_terms: { ja: '登録により利用規約に同意したものとみなします', en: 'By signing up, you agree to our Terms of Service', zh: '注册即表示同意服务条款', ko: '가입하면 이용약관에 동의하는 것입니다', es: 'Al registrarte, aceptas los Términos de Servicio' },

  // ===== Register =====
  register_title: { ja: 'メールで登録', en: 'Sign up with Email', zh: '邮箱注册', ko: '이메일로 가입', es: 'Registrarse con Email' },
  register_login_title: { ja: 'ログイン', en: 'Sign In', zh: '登录', ko: '로그인', es: 'Iniciar sesión' },
  register_email_placeholder: { ja: 'メールアドレス...', en: 'Email address...', zh: '邮箱地址...', ko: '이메일 주소...', es: 'Correo electrónico...' },
  register_password_placeholder: { ja: 'パスワード（6文字以上）...', en: 'Password (6+ characters)...', zh: '密码（6位以上）...', ko: '비밀번호 (6자 이상)...', es: 'Contraseña (6+ caracteres)...' },
  register_submit: { ja: '登録する', en: 'Sign Up', zh: '注册', ko: '가입하기', es: 'Registrarse' },
  register_submit_login: { ja: 'ログイン', en: 'Sign In', zh: '登录', ko: '로그인', es: 'Iniciar sesión' },
  register_switch_to_login: { ja: 'ログインはこちら', en: 'Already have an account?', zh: '已有账号？登录', ko: '이미 계정이 있나요?', es: '¿Ya tienes cuenta?' },
  register_switch_to_signup: { ja: 'アカウントを作成する', en: 'Create an account', zh: '创建账号', ko: '계정 만들기', es: 'Crear una cuenta' },
  register_error_empty: { ja: 'メールとパスワードを入力してください', en: 'Please enter email and password', zh: '请输入邮箱和密码', ko: '이메일과 비밀번호를 입력하세요', es: 'Introduce email y contraseña' },
  register_error_short_password: { ja: 'パスワードは6文字以上で入力してください', en: 'Password must be at least 6 characters', zh: '密码至少6位', ko: '비밀번호는 6자 이상이어야 합니다', es: 'La contraseña debe tener al menos 6 caracteres' },
  register_error_invalid: { ja: 'メールまたはパスワードが正しくありません', en: 'Invalid email or password', zh: '邮箱或密码错误', ko: '이메일 또는 비밀번호가 올바르지 않습니다', es: 'Email o contraseña incorrectos' },
  register_error_exists: { ja: 'このメールは既に登録されています', en: 'This email is already registered', zh: '该邮箱已注册', ko: '이미 등록된 이메일입니다', es: 'Este email ya está registrado' },

  // ===== Nickname =====
  nickname_title: { ja: 'ニックネームを決めよう', en: 'Choose your nickname', zh: '设置昵称', ko: '닉네임을 정하세요', es: 'Elige tu apodo' },
  nickname_hint: { ja: 'ランキングやフレンドに表示されます\n3〜12文字', en: 'Shown in rankings and friends list\n3-12 characters', zh: '将显示在排行榜和好友列表中\n3-12个字符', ko: '랭킹과 친구 목록에 표시됩니다\n3~12자', es: 'Se mostrará en rankings y lista de amigos\n3-12 caracteres' },
  nickname_placeholder: { ja: 'ニックネーム...', en: 'Nickname...', zh: '昵称...', ko: '닉네임...', es: 'Apodo...' },
  nickname_start: { ja: 'はじめる', en: 'Start', zh: '开始', ko: '시작', es: 'Empezar' },
  nickname_error: { ja: 'ニックネームは3〜12文字で入力してください', en: 'Nickname must be 3-12 characters', zh: '昵称需要3-12个字符', ko: '닉네임은 3~12자로 입력하세요', es: 'El apodo debe tener 3-12 caracteres' },

  // ===== Home =====
  home_title: { ja: 'メインメニュー', en: 'MAIN MENU', zh: '主菜单', ko: '메인 메뉴', es: 'MENÚ PRINCIPAL' },
  home_daily_missions: { ja: 'デイリーミッション', en: 'DAILY MISSIONS', zh: '每日任务', ko: '일일 미션', es: 'MISIONES DIARIAS' },
  home_day_streak: { ja: '日連続', en: ' day streak', zh: '天连续', ko: '일 연속', es: ' días seguidos' },
  home_quick_start: { ja: 'クイックスタート', en: 'QUICK START', zh: '快速开始', ko: '퀵 스타트', es: 'INICIO RÁPIDO' },
  home_draw_character: { ja: 'キャラを描く', en: 'DRAW CHARACTER', zh: '绘制角色', ko: '캐릭터 그리기', es: 'DIBUJAR PERSONAJE' },
  home_ai_battle: { ja: 'AIバトル', en: 'AI BATTLE', zh: 'AI对战', ko: 'AI 배틀', es: 'BATALLA IA' },
  home_fusion: { ja: '合成', en: 'FUSION', zh: '合成', ko: '합성', es: 'FUSIÓN' },
  home_status: { ja: 'ステータス', en: 'STATUS', zh: '状态', ko: '상태', es: 'ESTADO' },
  home_characters: { ja: 'キャラクター', en: 'CHARACTERS', zh: '角色', ko: '캐릭터', es: 'PERSONAJES' },
  home_wins: { ja: '勝利', en: 'WINS', zh: '胜场', ko: '승리', es: 'VICTORIAS' },
  home_battles: { ja: 'バトル数', en: 'BATTLES', zh: '对战数', ko: '배틀 수', es: 'BATALLAS' },
  home_recent: { ja: '最近のキャラクター', en: 'RECENT CHARACTERS', zh: '最近的角色', ko: '최근 캐릭터', es: 'PERSONAJES RECIENTES' },
  home_view_collection: { ja: 'コレクションを見る', en: 'VIEW COLLECTION', zh: '查看收藏', ko: '컬렉션 보기', es: 'VER COLECCIÓN' },
  home_offline: { ja: 'オフラインモード - AIバトルのみ', en: 'OFFLINE MODE - AI battles only', zh: '离线模式 - 仅AI对战', ko: '오프라인 모드 - AI 배틀만', es: 'MODO OFFLINE - Solo batallas IA' },
  home_complete: { ja: '完了', en: 'DONE', zh: '完成', ko: '완료', es: 'HECHO' },

  // ===== Draw =====
  draw_title: { ja: 'キャラを描こう', en: 'DRAW CHARACTER', zh: '绘制角色', ko: '캐릭터를 그리자', es: 'DIBUJA PERSONAJE' },
  draw_subtitle: { ja: 'キャラクターをスケッチしよう', en: 'SKETCH YOUR FIGHTER', zh: '画出你的战士', ko: '전사를 스케치하세요', es: 'DIBUJA TU LUCHADOR' },
  draw_here: { ja: 'ここに描こう', en: 'DRAW HERE', zh: '在此绘画', ko: '여기에 그리세요', es: 'DIBUJA AQUÍ' },
  draw_finger_hint: { ja: '指でキャラクターを描こう', en: 'Use your finger to sketch', zh: '用手指绘画', ko: '손가락으로 그려보세요', es: 'Usa tu dedo para dibujar' },
  draw_strokes: { ja: 'ストローク', en: 'STROKES', zh: '笔画', ko: '스트로크', es: 'TRAZOS' },
  draw_points: { ja: 'ポイント', en: 'POINTS', zh: '点数', ko: '포인트', es: 'PUNTOS' },
  draw_color: { ja: 'カラー', en: 'COLOR', zh: '颜色', ko: '색상', es: 'COLOR' },
  draw_brush_size: { ja: 'ブラシサイズ', en: 'BRUSH SIZE', zh: '画笔大小', ko: '브러시 크기', es: 'TAMAÑO DE PINCEL' },
  draw_clear: { ja: 'クリア', en: 'CLEAR', zh: '清除', ko: '지우기', es: 'BORRAR' },
  draw_complete: { ja: '完成！', en: 'COMPLETE', zh: '完成', ko: '완성!', es: '¡COMPLETAR!' },
  draw_undo: { ja: '元に戻す', en: 'UNDO', zh: '撤销', ko: '실행 취소', es: 'DESHACER' },
  draw_no_data: { ja: 'まだ何も描いてません！', en: 'Draw something first!', zh: '请先画点什么！', ko: '먼저 뭔가 그려주세요!', es: '¡Dibuja algo primero!' },
  draw_pick_image: { ja: '画像から作成', en: 'FROM IMAGE', zh: '从图片创建', ko: '이미지에서 생성', es: 'DESDE IMAGEN' },
  draw_or: { ja: 'または', en: 'OR', zh: '或者', ko: '또는', es: 'O' },

  // ===== Missions =====
  mission_login: { ja: 'ログイン', en: 'Login', zh: '登录', ko: '로그인', es: 'Iniciar sesión' },
  mission_login_desc: { ja: '今日ログインする', en: 'Login today', zh: '今日登录', ko: '오늘 로그인하기', es: 'Iniciar sesión hoy' },
  mission_draw: { ja: 'お絵描き', en: 'Draw', zh: '绘画', ko: '그리기', es: 'Dibujar' },
  mission_draw_desc: { ja: 'キャラを1体描く', en: 'Draw 1 character', zh: '画1个角色', ko: '캐릭터 1개 그리기', es: 'Dibujar 1 personaje' },
  mission_battle: { ja: 'バトル', en: 'Battle', zh: '对战', ko: '배틀', es: 'Batalla' },
  mission_battle_desc: { ja: 'バトルを1回する', en: 'Play 1 battle', zh: '进行1场对战', ko: '배틀 1회 하기', es: 'Jugar 1 batalla' },
  mission_fusion: { ja: '合成', en: 'Fusion', zh: '合成', ko: '합성', es: 'Fusión' },
  mission_fusion_desc: { ja: '合成を1回する', en: 'Fuse 1 time', zh: '合成1次', ko: '합성 1회 하기', es: 'Fusionar 1 vez' },

  // ===== Special Move =====
  special_move_header: { ja: '\u25C7 必殺技 \u25C7', en: '\u25C7 SPECIAL MOVE \u25C7', zh: '\u25C7 必杀技 \u25C7', ko: '\u25C7 필살기 \u25C7', es: '\u25C7 MOVIMIENTO ESPECIAL \u25C7' },
  special_move_subtitle: { ja: 'キャラクターの必殺技に名前をつけよう', en: "Name your character's ultimate attack", zh: '为角色的必杀技命名', ko: '캐릭터의 필살기에 이름을 지어주세요', es: 'Pon nombre al ataque definitivo' },
  special_move_input_label: { ja: '\u25B7 必殺技名', en: '\u25B7 MOVE NAME', zh: '\u25B7 必杀技名', ko: '\u25B7 필살기명', es: '\u25B7 NOMBRE DEL MOVIMIENTO' },
  special_move_placeholder: { ja: '必殺技の名前を入力...', en: 'Enter special move name...', zh: '输入必杀技名称...', ko: '필살기 이름을 입력...', es: 'Nombre del movimiento...' },
  special_move_rank_mystery: { ja: '\u25C8 ランク: ???', en: '\u25C8 RANK: ???', zh: '\u25C8 等级: ???', ko: '\u25C8 랭크: ???', es: '\u25C8 RANGO: ???' },
  special_move_rank_reveal: { ja: 'バトル開始時に必殺技の威力が明らかに！', en: 'The power of your special move will be revealed when battle begins!', zh: '战斗开始时必杀技威力将会揭晓！', ko: '배틀이 시작되면 필살기의 위력이 밝혀집니다!', es: '¡El poder del movimiento se revelará al iniciar la batalla!' },
  special_move_tip_kanji: { ja: '\u25C7 パワー漢字でスコア大幅UP', en: '\u25C7 Power kanji boost score significantly', zh: '\u25C7 力量汉字大幅提升分数', ko: '\u25C7 파워 한자로 점수 대폭 UP', es: '\u25C7 Los kanji de poder aumentan mucho el puntaje' },
  special_move_tip_short: { ja: '\u25C7 短く濃い名前ほどランクUP', en: '\u25C7 Short, dense names rank higher', zh: '\u25C7 简短有力的名字等级更高', ko: '\u25C7 짧고 강한 이름일수록 랭크 UP', es: '\u25C7 Nombres cortos y densos ranquean más alto' },
  special_move_tip_filler: { ja: '\u25C7 余分な文字はパワーDOWN', en: '\u25C7 Filler characters reduce power', zh: '\u25C7 多余字符会降低威力', ko: '\u25C7 불필요한 문자는 파워 DOWN', es: '\u25C7 Caracteres de relleno reducen el poder' },
  special_move_section: { ja: '\u25C7 必殺技', en: '\u25C7 SPECIAL MOVE', zh: '\u25C7 必杀技', ko: '\u25C7 필살기', es: '\u25C7 MOVIMIENTO ESPECIAL' },
  special_move_battle_cutin: { ja: '\u25C7 必殺技 \u25C7', en: '\u25C7 SPECIAL MOVE \u25C7', zh: '\u25C7 必杀技 \u25C7', ko: '\u25C7 필살기 \u25C7', es: '\u25C7 MOVIMIENTO ESPECIAL \u25C7' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}

export default translations;

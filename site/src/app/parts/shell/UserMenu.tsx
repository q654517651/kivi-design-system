import { Avatar, Button, Divider, Dropdown, Menu, MenuItem, MenuSub, placeholderImageSrc, toast } from '@kivi';
import { useCopy } from '@kivi/hooks';
import { setLang, useLang, type Lang } from '../../data/lang';

/*
  点头像出的菜单（11-12 用户定）：顶栏原来的教程、反馈、语言、复制用户 Key 都收进来，余额胶囊还在外面。
  顶上头像 32 + 名字，下面一整行「复制用户 Key」按钮；下面教程（新窗口开飞书文档）、意见反馈（线上弹窗里嵌飞书表单，演示站只弹 Toast）、语言（悬停往一边甩出子菜单）。
  线上这里没有退出登录，没加
*/

const USER = { name: 'KIVI', avatar: placeholderImageSrc('ip-peek', '1:1') };
const LANGUAGES: { key: Lang; label: string }[] = [
  { key: 'zh', label: '中文' },
  { key: 'en', label: 'English' },
];

export function UserMenu() {
  const lang = useLang();
  const { copied, copy } = useCopy();
  return (
    <>
      <Dropdown
        placement="bottom-end"
        trigger={
          <button type="button" className="tpl-ms__avatar" aria-label="账号">
            <Avatar name={USER.name} size={32} src={USER.avatar} />
          </button>
        }
      >
        <Menu width={240}>
          <div className="tpl-ms__user">
            <Avatar name={USER.name} size={32} src={USER.avatar} />
            <span className="tpl-ms__user-name">{USER.name}</span>
          </div>
          {/* 整行按钮放在头像下面（11-12 用户定，照即梦「创建团队」）。线上点了现取一个 90 天的 token 再写进剪贴板；这里写死一串演示 */}
          <Button variant="secondary" className="tpl-ms__user-key" rightIcon={copied ? 'CheckSmall' : 'Copy'} onClick={() => copy('kivi-demo-user-key')}>
            复制用户 Key
          </Button>
          <Divider />
          <MenuItem icon="Document" onClick={() => window.open('https://micoworld.feishu.cn/wiki/K6ARwr4JZimr4kkE8vXcwgEenoc', '_blank', 'noopener')}>
            教程
          </MenuItem>
          <MenuItem icon="Feedback" onClick={() => toast.info('演示站不收反馈：正式站这里打开飞书反馈表单')}>
            意见反馈
          </MenuItem>
          <MenuSub trigger={<MenuItem icon="Localization">语言</MenuItem>}>
            <Menu role="listbox" aria-label="语言">
              {LANGUAGES.map((l) => (
                <MenuItem key={l.key} selected={lang === l.key} onClick={() => setLang(l.key)}>
                  {l.label}
                </MenuItem>
              ))}
            </Menu>
          </MenuSub>
        </Menu>
      </Dropdown>
    </>
  );
}

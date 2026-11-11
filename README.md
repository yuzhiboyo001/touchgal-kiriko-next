# Kiriko

Kiriko 是一个面向 Galgame 爱好者的资源与交流站点，提供游戏资料、资源检索、社区补链和看板娘互动。

- 站点：[https://kiriko.ink](https://kiriko.ink)
- 源码：[https://github.com/yuzhiboyo001/touchgal-kiriko-next](https://github.com/yuzhiboyo001/touchgal-kiriko-next)

## 致敬 TouchGal

Kiriko 是在 **TouchGal** 的基础上继续开发和个性化改造的二次开发项目。

感谢 TouchGal 原作者 **KUN1007** 以及 TouchGal 社区的开源工作。没有他们打下的基础，就没有现在的 Kiriko。

- TouchGal 原仓库：[KunMoe/kun-touchgal-next](https://github.com/KunMoe/kun-touchgal-next)
- 更早的上游项目：[KUN1007/kun-galgame-patch-next](https://github.com/KUN1007/kun-galgame-patch-next)

Kiriko 与原项目作者、官方团队没有隶属关系，也不代表原项目的官方立场。

## 本项目的主要改动

- 登录用户在线状态与个人主页在线标识
- 看板娘 AI 的分层调用与月度免费额度保护
- Kiriko 支持者铭牌与每日聊天配额
- 站点公告、使用指南和支持页面
- Kiriko 的视觉与交互调整

## 本地运行

需要 Node.js、pnpm、PostgreSQL、Redis。

```bash
git clone https://github.com/yuzhiboyo001/touchgal-kiriko-next.git
cd touchgal-kiriko-next
pnpm install
cp .env.example .env
pnpm prisma:push
pnpm dev
```

请根据自己的环境填写 `.env`，不要提交任何真实密钥。

## 开源协议

本项目遵循 **AGPL-3.0**。

任何修改和分发都应保留原始仓库与作者署名，并继续遵守 AGPL-3.0。

## 致谢

感谢 KUN1007、TouchGal 社区，以及所有为 Galgame 资料整理和开源生态做出贡献的人。

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

- Kiriko 的视觉与交互调整
- 看板娘 LLM 相关功能与额度保护

## Contributors

感谢 TouchGal 及其上游项目的所有贡献者：

- [Palentum](https://github.com/Palentum)
- [KunMoe / KUN1007](https://github.com/KunMoe)
- [json-q (JSQ)](https://github.com/json-q)
- [SimonShiki](https://github.com/SimonShiki)
- [nonhana (non_hana)](https://github.com/nonhana)
- [flipwind](https://github.com/flipwind)
- [TangTangChu (糖糖毬)](https://github.com/TangTangChu)
- [Saul-Mirone](https://github.com/Saul-Mirone)
- [asukaminato0721](https://github.com/asukaminato0721)
- [yuzhiboyo001](https://github.com/yuzhiboyo001)（Kiriko 维护）

没有你们的代码、文档、反馈和整理工作，就没有 TouchGal，也没有现在的 Kiriko。

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

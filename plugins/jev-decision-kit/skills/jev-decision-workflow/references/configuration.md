# Configuration and initialization

The plugin keeps connection settings in the user's local config file and reads credentials only from the process environment.

## Initialize

From the plugin root, set the key without putting it in shell history, then persist the user-level key on Windows:

```powershell
$env:JEV_API_KEY = Read-Host "JEV API key"
node scripts/init.mjs --base-url "https://api.gaoxin.net.cn" --endpoint "/typesafe/v1/systemone" --model "jev-latest" --persist-key
```

The script writes non-secret settings to `%USERPROFILE%\\.codex\\jev-decision-kit\\config.json` on Windows (or `$HOME/.codex/jev-decision-kit/config.json` elsewhere). It never writes the key to that file.

Use `--config-path` for an isolated profile or CI job. In CI, inject `JEV_API_KEY` as a secret and omit `--persist-key`.

## Precedence

For the endpoint, highest precedence wins: `JEV_API_URL`, local `api_url`, `JEV_BASE_URL` + `JEV_ENDPOINT`, local `base_url` + `endpoint`, then the default endpoint.

The model uses per-call `model`, then `JEV_MODEL`, then local config `model`, then `jev-latest`. The key uses `JEV_API_KEY`, then `TYPESAFE_API_KEY`. It is never accepted from request state or written to the repository.

By default, endpoint availability failures can fall back to `https://api-sh.gaoxin.net.cn/typesafe/v1/systemone`. Set `JEV_FALLBACK_API_URL` to override or `JEV_DISABLE_FALLBACK=1` to disable fallback.

## Verify

```powershell
node scripts/evaluate.mjs --config-status
```

The status output reports only whether a key is configured, the resolved endpoint, model, and config path. It does not print the key.

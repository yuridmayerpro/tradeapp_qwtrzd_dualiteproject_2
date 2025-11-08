/*
# [ADD_BINANCE_KEYS]
Adiciona colunas para armazenar as chaves de API da Binance na tabela de configurações do usuário.

## Query Description: [Esta operação adiciona as colunas `binance_api_key` e `binance_secret_key` à tabela `user_settings`. As chaves são armazenadas como texto e protegidas pelas Políticas de Segurança em Nível de Linha (RLS) existentes, garantindo que cada usuário só possa acessar suas próprias chaves. Não há risco de perda de dados existentes.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tabela afetada: `public.user_settings`
- Colunas adicionadas:
  - `binance_api_key` (type: text)
  - `binance_secret_key` (type: text)

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No] - As políticas existentes na tabela `user_settings` protegerão os novos dados.
- Auth Requirements: [O usuário precisa estar autenticado para modificar suas próprias chaves.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Nenhum impacto de performance esperado.]
*/

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS binance_api_key TEXT,
ADD COLUMN IF NOT EXISTS binance_secret_key TEXT;

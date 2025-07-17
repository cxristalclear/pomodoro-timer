Public Schema Tables:
tasks Table:
    id (bigint, primary key)
    user_id (uuid)
    name (text)
    completed (boolean)
    position (integer)
    created_at (timestamp with time zone)
    completed_at (timestamp with time zone)
    estimated_pomodoros (integer)
    actual_pomodoros (integer)
    task_id_in_sessions (uuid)
    category (text)
    priority (text, with check constraint: 'high', 'medium', 'low')
    due_date (timestamp with time zone)
    notes (text)
    is_archived (boolean)
    parent_task_id (bigint)

sessions Table:
    id (bigint, primary key)
    user_id (uuid)
    task (text)
    duration (integer)
    date (date)
    completed_at (timestamp with time zone)
    task_id (bigint)

settings Table:
    id (bigint, primary key)
    user_id (uuid, unique)
    work_duration (integer)
    break_duration (integer)
    long_break_duration (integer)
    sessions_until_long_break (integer)
    sound_enabled (boolean)
    sound_volume (numeric)
    auto_start_breaks (boolean)
    auto_start_work (boolean)
    created_at (timestamp with time zone)
    updated_at (timestamp with time zone)
    timer_display_mode (text)
    notifications_enabled (boolean)

profiles Table:
    id (uuid, primary key)
    email (text)
    created_at (timestamp with time zone)
    updated_at (timestamp with time zone)


Auth Schema Tables:
    users
    audit_log_entries
    flow_state
    identities
    instances
    mfa_amr_claims
    mfa_challenges
    mfa_factors
    one_time_tokens
    refresh_tokens
    saml_providers
    saml_relay_states
    schema_migrations
    sessions
    sso_domains
    sso_providers

users Table:
    id (uuid, primary key)
    email
    encrypted_password
    raw_app_meta_data
    raw_user_meta_data
    created_at
    updated_at
    email_confirmed_at
    phone_confirmed_at
    last_sign_in_at
    confirmation_sent_at
    recovery_sent_at
    email_change_sent_at
    new_email
    new_phone
    invited_at
    confirmation_token
    recovery_token
    email_change_token
    phone_change_token
    email_change_token_current
    phone_change_token_current
    aud
    role
    phone

identities Table:
    id
    user_id
    provider_id
    provider
    provider_type
    created_at
    last_sign_in_at
    identity_data

audit_log_entries Table:
    Tracks authentication and user-related events

flow_state Table:
    Manages authentication flow states

mfa_factors Table:
    id
    user_id
    status
    factor_type
    created_at
    updated_at
    friendly_name

mfa_challenges Table:
    Manages multi-factor authentication challenges

mfa_amr_claims Table:
    Authentication Method Reference claims

one_time_tokens Table:
    Manages one-time tokens for authentication

refresh_tokens Table:
    Stores refresh tokens for authentication

saml_providers Table:
    Manages SAML authentication providers

saml_relay_states Table:
    Manages SAML relay states

sessions Table:
    Tracks user sessions

sso_domains Table:
    Manages Single Sign-On domains

sso_providers Table:
    Manages Single Sign-On providers

Storage Schema Tables:

Extensions Schema:



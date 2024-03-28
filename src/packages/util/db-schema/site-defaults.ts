/*
 *  This file is part of CoCalc: Copyright © 2020 Sagemath, Inc.
 *  License: AGPLv3 s.t. "Commons Clause" – see LICENSE.md for details
 */

// Default settings to customize a given site, typically a private install of CoCalc.

import jsonic from "jsonic";

import { is_valid_email_address } from "@cocalc/util/misc";
import { USER_SELECTABLE_LANGUAGE_MODELS } from "./llm-utils";
import { isEqual } from "lodash";

export type ConfigValid = Readonly<string[]> | ((val: string) => boolean);

export type RowType = "header" | "setting";

// for filtering, exact matches
export const TAGS = [
  "openai",
  "jupyter",
  "email",
  "logo",
  "version",
  "stripe",
  "captcha",
  "zendesk",
  "github",
  "pay as you go",
  "compute servers",
  "ai-llm",
  "theme",
  "onprem",
] as const;
export type Tag = (typeof TAGS)[number];

export type SiteSettingsKeys =
  | "theming"
  | "site_name"
  | "site_description"
  | "account_creation_email_instructions"
  | "help_email"
  | "logo_square"
  | "logo_rectangular"
  | "splash_image"
  | "index_info_html"
  | "imprint"
  | "policies"
  | "openai_enabled"
  | "google_vertexai_enabled"
  | "mistral_enabled"
  | "anthropic_enabled"
  | "ollama_enabled"
  | "selectable_llms"
  | "neural_search_enabled"
  | "jupyter_api_enabled"
  | "organization_name"
  | "organization_email"
  | "organization_url"
  | "terms_of_service"
  | "terms_of_service_url"
  | "commercial"
  | "max_trial_projects"
  | "nonfree_countries"
  | "google_analytics"
  | "kucalc"
  | "dns"
  | "datastore"
  | "ssh_gateway"
  | "ssh_gateway_dns"
  | "ssh_gateway_fingerprint"
  | "versions"
  | "version_min_project"
  | "version_compute_server_min_project"
  | "version_min_browser"
  | "version_recommended_browser"
  | "iframe_comm_hosts"
  | "onprem_quota_heading"
  | "default_quotas"
  | "max_upgrades"
  | "email_enabled"
  | "verify_emails"
  | "email_signup"
  | "anonymous_signup"
  | "anonymous_signup_licensed_shares"
  | "share_server"
  | "landing_pages"
  | "sandbox_projects_enabled"
  | "sandbox_project_id"
  | "new_project_pool"
  | "compute_servers_enabled"
  | "compute_servers_google-cloud_enabled"
  | "compute_servers_onprem_enabled"
  | "compute_servers_dns_enabled"
  | "compute_servers_dns";

//| "compute_servers_lambda-cloud_enabled"

type Mapping = { [key: string]: string | number | boolean };

type ToVal = boolean | string | number | string[] | Mapping;
type ToValFunc<T> = (
  val?: string,
  config?: { [key in SiteSettingsKeys]?: string },
) => T;

export interface Config {
  readonly name: string;
  readonly desc: string;
  // there must be a default value, even if it is just ''
  readonly default: string;
  // list of allowed strings or a validator function
  readonly valid?: ConfigValid;
  readonly password?: boolean;
  readonly show?: (conf: any) => boolean;
  // this optional function derives the actual value of this setting from current value or from a global (unprocessed) setting.
  readonly to_val?: ToValFunc<ToVal>;
  // this optional function derives the visual representation for the admin (fallback: to_val)
  readonly to_display?: (val: string | string[]) => string;
  readonly hint?: (val: string) => string; // markdown
  readonly type?: RowType;
  readonly clearable?: boolean; // default false
  readonly multiline?: number;
  readonly cocalc_only?: boolean; // only for use on cocalc.com (or subdomains)
  readonly help?: string; // markdown formatted help text
  readonly tags?: Readonly<Tag[]>; // tags for filtering
}

export type SiteSettings = Record<SiteSettingsKeys, Config>;

const fallback = (
  conf: { [key in SiteSettingsKeys]: string },
  name: SiteSettingsKeys,
): string => conf[name] ?? site_settings_conf[name].default;

// little helper fuctions, used in the site settings & site settings extras
export const is_email_enabled = (conf): boolean =>
  to_bool(conf.email_enabled) && conf.email_backend !== "none";
export const only_for_smtp = (conf): boolean =>
  is_email_enabled(conf) && conf.email_backend === "smtp";
export const only_for_sendgrid = (conf): boolean =>
  is_email_enabled(conf) && conf.email_backend === "sendgrid";
export const only_for_password_reset_smtp = (conf): boolean =>
  to_bool(conf.email_enabled) && conf.password_reset_override === "smtp";
export const only_onprem = (conf): boolean =>
  conf.kucalc === KUCALC_ON_PREMISES;
export const only_ssh_gateway = (conf): boolean => to_bool(conf.ssh_gateway);
export const only_cocalc_com = (conf): boolean =>
  conf.kucalc === KUCALC_COCALC_COM;
export const not_cocalc_com = (conf): boolean => !only_cocalc_com(conf);
export const show_theming_vars = (conf): boolean =>
  to_bool(fallback(conf, "theming"));
export const only_commercial = (conf): boolean =>
  to_bool(fallback(conf, "commercial"));
export const to_bool = (val): boolean =>
  val === "true" || val === "yes" || (typeof val === "boolean" && val);
export const to_trimmed_str = (val?: string): string => (val ?? "").trim();
export const only_booleans = ["yes", "no"]; // we also understand true and false
export const to_int = (val): number => parseInt(val);
export const only_ints = (val) =>
  ((v) => !isNaN(v) && Number.isFinite(v) && Number.isInteger(val))(
    to_int(val),
  );
export const only_nonneg_int = (val) =>
  ((v) => only_ints(v) && v >= 0)(to_int(val));
export const only_pos_int = (val) =>
  ((v) => only_ints(v) && v > 0)(to_int(val));

export const toFloat = (val): number => parseFloat(val);
export const onlyFloats = (val) =>
  ((v) => !isNaN(v) && Number.isFinite(v))(toFloat(val));
export const onlyNonnegFloat = (val) =>
  ((v) => onlyFloats(v) && v >= 0)(toFloat(val));
export const onlyPosFloat = (val) =>
  ((v) => onlyFloats(v) && v > 0)(toFloat(val));
export function to_list_of_llms(val?: string, fallbackAll = true): string[] {
  if (!val?.trim())
    return fallbackAll ? [...USER_SELECTABLE_LANGUAGE_MODELS] : [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter((v) => USER_SELECTABLE_LANGUAGE_MODELS.includes(v as any));
}

export const is_list_of_llms = (val: string) =>
  val
    .split(",")
    .map((s) => s.trim())
    .every((s) => USER_SELECTABLE_LANGUAGE_MODELS.includes(s as any));

export const from_json = (conf): Mapping => {
  try {
    if (conf !== null) {
      return jsonic(conf) ?? {};
    }
  } catch (_) {}
  return {};
};
export const parsableJson = (conf): boolean => {
  try {
    jsonic(conf ?? "{}");
    return true;
  } catch (_) {
    return false;
  }
};

export const displayJson = (conf) =>
  JSON.stringify(from_json(conf), undefined, 2);

// TODO a cheap'n'dirty validation is good enough
export const valid_dns_name = (val) => val.match(/^[a-zA-Z0-9.-]+$/g);

export const split_iframe_comm_hosts: ToValFunc<string[]> = (hosts) =>
  (hosts ?? "").match(/[a-z0-9.-]+/g) || [];

const split_strings: ToValFunc<string[]> = (str) =>
  (str ?? "").match(/[a-zA-Z0-9]+/g) || [];

function num_dns_hosts(val): string {
  return `Found ${split_iframe_comm_hosts(val).length} hosts.`;
}

const commercial_to_val: ToValFunc<boolean> = (
  val?,
  conf?: { [key in SiteSettingsKeys]: string },
) => {
  // special case: only if we're in cocalc.com production mode, the commercial setting can be true at all
  const kucalc =
    conf != null ? fallback(conf, "kucalc") : site_settings_conf.kucalc.default;
  if (kucalc === KUCALC_COCALC_COM) {
    return to_bool(val);
  }
  return false;
};

const gateway_dns_to_val: ToValFunc<string> = (
  val?,
  conf?: { [key in SiteSettingsKeys]: string },
): string => {
  // sensible default, in case ssh gateway dns is not set – fallback to the known value in prod/test or the DNS.
  const dns: string = to_trimmed_str(conf?.dns ?? "");
  return (
    (val ?? "").trim() ||
    (conf != null && only_cocalc_com(conf) ? `ssh.${dns}` : dns)
  );
};

export const DATASTORE_TITLE = "Cloud Storage & Remote Filesystems";
export const KUCALC_DISABLED = "no";
export const KUCALC_COCALC_COM = "yes";
export const KUCALC_ON_PREMISES = "onprem";
const KUCALC_VALID_VALS = [
  KUCALC_COCALC_COM,
  KUCALC_ON_PREMISES,
  KUCALC_DISABLED,
] as const;
export type KucalcValues = (typeof KUCALC_VALID_VALS)[number];

const DEFAULT_QUOTAS_HELP = `
### Default quotas

Define the default quotas for a project pod, and overcommitment factors if there are additional upgrades.

| Name | Example | Unit | Description |
| :--------- | :--------- | :----- | :----- |
| idle_timeout | 3600 | seconds | after how many seconds of inactivity a project is stopped |
| internet | true  | boolean  | if false, project pod is annotated in a way to disable network access |
| mem  | 1000 | MB | shared memory limit |
| cpu | 1  | Cores | shared CPU limit |
| mem_oc | 5 | 1:N | Memory overcommitment factor, used to calculate the memory request unless explicilty given |
| cpu_oc | 10 | 1:N | CPU overcommitment factor, used to calculate the cpu request unless explicilty given |
`;

const MAX_UPGRADES_HELP = `
### Maximum Upgrades

These are limits for the total upgrade of a project pod.

| Name | Example | Unit | Description |
| :--------- | :--------- | :----- | :----- |
| memory | 16000 | MB | shared memory |
| memory_request | 8000 | MB | requested memory, must be smaller than memory |
| cores | 32 | cores | limit of cores
| cpu_shares| 2048 | 1/1024th | fraction of a core for the cpu request limit |
| mintime | 80000 | seconds | max idle timeout, unless always running is set
| always_running | 1 | | 0 or 1 | if true, project pod is started automatically |
| network | 1 | | 0 or 1  | network access |
| disk_quota | | |  not applicable |
| member_host | | | not applicable  |
| ephemeral_state | | | not applicable |
| ephemeral_disk | | | not applicable |
`;

const help_email_name = "Help email";
const organization_email_desc = `How to contact your organization (fallback: '${help_email_name}').`;

// You can use markdown in the descriptions below!

export const site_settings_conf: SiteSettings = {
  // ========= THEMING ===============
  dns: {
    name: "Domain name",
    desc: "DNS for your server, e.g. `cocalc.universe.edu`.  Does NOT include the basePath.  It optionally can start with `http://` (for non SSL) and end in a `:number` for a port.  This is mainly used for password resets and invitation and sign up emails, since they need to know a link to the site.",
    default: "",
    to_val: to_trimmed_str,
    //valid: valid_dns_name,
  },
  theming: {
    name: "Show Theming",
    desc: "If 'No', the fields below are hidden, not disabled!",
    default: "yes",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["theme"],
  },
  site_name: {
    name: "Site name",
    desc: "The heading name of your CoCalc site.",
    default: "Open CoCalc",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  site_description: {
    name: "Site description",
    desc: "A tagline describing your site.",
    default: "Collaborative Calculation",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  help_email: {
    name: help_email_name,
    desc: "Email address that user is directed to use for support requests",
    default: "",
    valid: is_valid_email_address,
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  terms_of_service_url: {
    name: "Terms of Service URL",
    desc: "URL to the page describing ToS, Policies, etc. (leave empty to not require)",
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  terms_of_service: {
    name: "ToS information",
    desc: "The text displayed for the terms of service link (empty falls back a boilerplate using the URL).",
    default: "You agree to the <em>Terms of Service</em>.",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  account_creation_email_instructions: {
    name: "Account creation",
    desc: `Instructions displayed above near the box where a user creates their account, e.g., "Let's begin the adventure!"`,
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  organization_name: {
    name: "Organization name",
    desc: "The name of your organization, e.g. 'Hogwarts School of Witchcraft and Wizardry'.",
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  organization_email: {
    name: "Contact email address",
    desc: organization_email_desc,
    default: "",
    clearable: true,
    valid: is_valid_email_address,
    show: show_theming_vars,
    tags: ["theme"],
  },
  organization_url: {
    name: "Organization website",
    desc: "URL link to your organization",
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  logo_square: {
    name: "Logo (square)",
    desc: "URL of a square logo (SVG or PNG, about 200x200 px)",
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["logo", "theme"],
  },
  logo_rectangular: {
    name: "Logo (rectangular)",
    desc: "URL of a rectangular logo (about 450x75 px, SVG or PNG)",
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["logo", "theme"],
  },
  splash_image: {
    name: "Index page picture",
    desc: "URL of an image displayed on the index page (about 1200x800 px)",
    default: "",
    clearable: true,
    show: show_theming_vars,
    tags: ["theme"],
  },
  index_info_html: {
    name: "Index page info",
    desc: "An HTML/Markdown string displayed on the index page. If set, replaces the Index page picture!",
    default: "",
    clearable: true,
    show: show_theming_vars,
    multiline: 5,
    tags: ["theme"],
  },
  imprint: {
    name: "Imprint page",
    desc: "Imprint information on optional dedicated page – HTML/Markdown.",
    default: "",
    clearable: true,
    show: show_theming_vars,
    multiline: 5,
    tags: ["theme"],
  },
  policies: {
    name: "Policies page",
    desc: "Policies information on optional dedicated page – HTML/Markdown.",
    default: "",
    clearable: true,
    show: show_theming_vars,
    multiline: 5,
    tags: ["theme"],
  },
  // ============== END THEMING ============

  versions: {
    name: "Client Versions",
    desc: "",
    default: "",
    type: "header",
    tags: ["version"],
  },
  version_min_project: {
    name: "Required project version",
    desc: "Minimal version required by projects (if project older, will be force restarted).",
    default: "0",
    valid: only_nonneg_int,
    show: () => true,
    tags: ["version"],
  },
  version_min_browser: {
    name: "Required browser version",
    desc: "Minimal version required for browser clients (if older, forced disconnect).",
    default: "0",
    valid: only_nonneg_int,
    show: () => true,
    tags: ["version"],
  },
  version_recommended_browser: {
    name: "Recommended version",
    desc: "Older clients receive an upgrade warning.",
    default: "0",
    valid: only_nonneg_int,
    show: () => true,
    tags: ["version"],
  },
  kucalc: {
    name: "KuCalc UI",
    desc: `Configure which UI elements to show in order to match the Kubernetes backend. '${KUCALC_COCALC_COM}' for cocalc.com production site, '${KUCALC_ON_PREMISES}' for on-premises Kubernetes, or '${KUCALC_DISABLED}' for Docker`,
    default: KUCALC_DISABLED,
    valid: KUCALC_VALID_VALS,
    tags: ["onprem"],
  },
  google_analytics: {
    name: "Google Analytics",
    desc: `A Google Analytics GA4 tag for tracking usage of your site ("G-...").`,
    default: "",
    show: only_cocalc_com,
  },
  commercial: {
    name: "Commercial",
    desc: "Whether or not to include user interface elements related to for-pay upgrades and other features.  Set to 'yes' to include these elements. **IMPORTANT:** *You must restart your server after changing this setting for it to take effect.*",
    default: "no",
    valid: only_booleans,
    to_val: commercial_to_val,
    show: only_cocalc_com,
  },
  max_trial_projects: {
    name: "Maximum Trial Projects",
    desc: "Limit where we start blocking trial projects from running in nonfree countries. (0 means disabled)",
    default: "0",
    to_val: to_int,
    valid: only_nonneg_int,
    show: only_cocalc_com,
  },
  nonfree_countries: {
    name: "Nonfree Countries",
    desc: "ISO 3166-1 Alpha 2 country codes where extra usage restrictions apply",
    default: "",
    to_val: split_strings,
    show: only_cocalc_com,
  },
  datastore: {
    name: "Datastore",
    desc: `Show the '${DATASTORE_TITLE}' panel in the project settings`,
    default: "yes",
    valid: only_booleans,
    show: only_onprem,
    to_val: to_bool,
  },
  onprem_quota_heading: {
    name: "On-prem Quotas",
    desc: "",
    default: "",
    show: only_onprem,
    type: "header",
    tags: ["onprem"],
  },
  default_quotas: {
    name: "Default Quotas",
    desc: "A JSON-formatted default quota for projects. This is only for on-prem setups. The fields actual meaning is defined in hub's `quota.ts` code",
    default: "{}",
    help: DEFAULT_QUOTAS_HELP,
    show: only_onprem,
    to_val: from_json,
    to_display: displayJson,
    valid: parsableJson,
    tags: ["onprem"],
  },
  max_upgrades: {
    name: "Maximum Quota Upgrades",
    desc: "A JSON-formatted upper limit of all quotas. This is only for on-prem setups. The fields are defined in the upgrade spec.",
    default: "{}",
    help: MAX_UPGRADES_HELP,
    show: only_onprem,
    to_val: from_json,
    to_display: displayJson,
    valid: parsableJson,
    tags: ["onprem"],
  },
  ssh_gateway: {
    name: "SSH Gateway",
    desc: "Show corresponding UI elements",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
  },
  ssh_gateway_dns: {
    name: "SSH Gateway's DNS",
    desc: "This is the DNS name of the SSH gateway server. It is used to construct the SSH login to connect to a project. In doubt, set this to the DNS value.",
    default: "",
    valid: valid_dns_name,
    show: only_ssh_gateway,
    to_val: gateway_dns_to_val,
  },
  ssh_gateway_fingerprint: {
    name: "SSH Gateway's Fingerprint",
    desc: "Tell users the fingerprint of the SSH gateway server. This is used to verify that the SSH gateway server is the one they expect. E.g., `SHA256:8fa43247...`",
    default: "",
    show: only_ssh_gateway,
    to_val: to_trimmed_str,
  },
  iframe_comm_hosts: {
    name: "IFrame embedding",
    desc: "DNS hostnames, which are allowed to embed and communicate with this CoCalc instance. Strings starting with a dot will match subdomains. Hosts are tokens matching `[a-zA-Z0-9.-]+`. In production, this needs `co proxy update-config` & restart.",
    default: "",
    to_val: split_iframe_comm_hosts,
    to_display: num_dns_hosts,
  },
  email_enabled: {
    name: "Email sending enabled",
    desc: "Controls visibility of UI elements and if any emails are sent. This is independent of any particular email configuration!",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["email"],
  },
  verify_emails: {
    name: "Verify email addresses",
    desc: "If 'true', email verification tokens are sent out + account settings UI shows it – email sending must be enabled",
    default: "no",
    show: is_email_enabled,
    valid: only_booleans,
    to_val: to_bool,
    tags: ["email"],
  },
  email_signup: {
    name: "Allow email signup",
    desc: "Users can sign up via email & password. Could be subject to an 'account creation token'.",
    default: "yes",
    valid: only_booleans,
    to_val: to_bool,
  },
  anonymous_signup: {
    name: "Allow anonymous signup",
    desc: "Users can create a temporary account with no email, password or single sign on.  This won't work if you have any registration tokens set below.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
  },
  anonymous_signup_licensed_shares: {
    name: "Allow anonymous signup for licensed shared files",
    desc: "Users can create a temporary account with no email, password or single sign on when editing a copy of content shared on the share server that has a corresponding license.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
  },
  share_server: {
    name: "Allow public file sharing",
    desc: "Users are allowed to publicly share files on the public share server (`https://yourserver/share`).  If this is disabled, then the share server will not run and users will not be allowed to share files from their projects.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
  },
  landing_pages: {
    name: "Landing pages",
    desc: "Host landing pages about the functionality of CoCalc.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    show: only_cocalc_com,
    cocalc_only: true,
  },
  sandbox_projects_enabled: {
    name: "Enable Public Sandbox Projects",
    desc: "If enabled, this makes it possible for users to set a project to be a public sandbox.  There are significant negative security implications to sandbox projects, so only use this with a trusted group of users, e.g., on a private network.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
  },
  sandbox_project_id: {
    name: "Systemwide Public Sandbox Project ID",
    desc: "The `project_id` (a UUIDv4) of a sandbox project on your server for people who visit CoCalc to play around with.  This is potentially dangerous, so use with care!  This project MUST have 'Sandbox' enabled in project settings, so that anybody can access it.",
    default: "",
  },
  new_project_pool: {
    name: "New Project Pool",
    desc: "Number of new non-upgraded running projects to have at the ready to speed up the experience of creating new projects for users in interactive settings (where they are likely to immediately open the project).",
    default: "0",
    valid: only_nonneg_int,
    show: () => true,
  },
  openai_enabled: {
    name: "OpenAI ChatGPT UI",
    desc: "Controls visibility of UI elements related to ChatGPT integration.  You must **also set your OpenAI API key** below for this functionality to work.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["openai", "ai-llm"],
  },
  google_vertexai_enabled: {
    name: "Google Generative AI UI",
    desc: "Controls visibility of UI elements related to Google's **Gemini Generative AI** integration.  You must **also set your Gemini Generative AI API key** below for this functionality to work.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["ai-llm"],
  },
  mistral_enabled: {
    name: "Mistral AI UI",
    desc: "Controls visibility of UI elements related to Mistral AI integration.  You must **also set your Mistral API key** below for this functionality to work.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["ai-llm"],
  },
  anthropic_enabled: {
    name: "Anthropic AI UI",
    desc: "Controls visibility of UI elements related to Anthropic AI integration.  You must **also set your Anthropic API key** below for this functionality to work.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["ai-llm"],
  },
  ollama_enabled: {
    name: "Ollama LLM UI",
    desc: "Controls visibility of UI elements related to Ollama integration.  To make this actually work, configure the list of API/model endpoints in the Ollama configuration.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["ai-llm"],
  },
  selectable_llms: {
    name: "User Selectable LLMs",
    desc: "If this is empty, all available LLMs by enabled services will be selectable by your users. If you select one or more, only those LLMs will be shown. This does not affect the availibiltiy of Ollama models.",
    default: "",
    valid: is_list_of_llms,
    to_val: (v) => to_list_of_llms(v), // note: we store this as a comma separated list of model strings
    to_display: (val: string | string[]) => {
      const list = Array.isArray(val) ? val : to_list_of_llms(val);
      return isEqual(list, USER_SELECTABLE_LANGUAGE_MODELS)
        ? "All LLMs of enabled services will be selectable"
        : list.join(", ");
    },
    tags: ["ai-llm"],
  },
  neural_search_enabled: {
    name: "OpenAI Neural Search UI",
    desc: "Controls visibility of UI elements related to Neural Search integration.  You must **also set your OpenAI API key** below and fully configure the **Qdrant vector database** for neural search to work.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["openai"],
  },
  jupyter_api_enabled: {
    name: "Jupyter API",
    desc: "If true, the public Jupyter API is enabled. This provides stateless evaluation of Jupyter code from the landing page and share server by users that may not be signed in.  This requires further configuration of the <i>Jupyter API Account Id</i>.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["jupyter"],
  },
  compute_servers_enabled: {
    name: "Enable Compute Servers",
    desc: "Whether or not to include user interface elements related to compute servers.  Set to 'yes' to include these elements.  You will also need to configure 'Compute Servers -- remote cloud services' elsewhere.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["compute servers"],
  },
  version_compute_server_min_project: {
    name: "Required project version for compute server",
    desc: "Minimal *project* version required when starting a compute servers (if project older, error is displayed in frontend when user tries to start compute server).",
    default: "0",
    valid: only_nonneg_int,
    show: () => true,

    tags: ["compute servers"],
  },
  "compute_servers_google-cloud_enabled": {
    name: "Enable Compute Servers - Google Cloud",
    desc: "Whether or not to include google cloud compute servers.  You must also configure a Google service account below.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["compute servers"],
  },
  compute_servers_onprem_enabled: {
    name: "Enable Compute Servers - On Prem",
    desc: "Whether or not to include on prem compute servers.  Right now, these are VM's that must be manually managed by a user and involve copy/paste, but someday they will be much more automated.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["compute servers"],
  },
  //   "compute_servers_lambda-cloud_enabled": {
  //     name: "Enable Compute Servers - Lambda Cloud",
  //     desc: "Whether or not to include Lambda cloud compute servers.  You must also configure an API key below.  **WARNING:** As of October 2023, there is no legal way to use Lambda cloud  without a reseller agreement with Lambda cloud, if you're selling use of a CoCalc server.  Such agreements don't exist yet.",
  //     default: "no",
  //     valid: only_booleans,
  //     to_val: to_bool,
  //     tags: ["compute servers"],
  //   },
  compute_servers_dns_enabled: {
    name: "Enable Compute Servers - Cloudflare DNS",
    desc: "Whether or not to include user interface elements related to Cloudflare DNS for compute servers, for automatic configuration of sites like https://foo.cocalc.io.  Set to 'yes' to include these elements.  You will also need to configure 'Compute Servers -- Domain Name, and Cloudflare API token' below.",
    default: "no",
    valid: only_booleans,
    to_val: to_bool,
    tags: ["compute servers"],
  },
  compute_servers_dns: {
    name: "Compute Servers: Domain name",
    desc: "Base domain name for your compute servers, e.g. 'cocalc.io'.  This is used along with the 'CloudFlare API Token' below so that compute servers get a custom stable subdomain name foo.cocalc.io (say) along with an https certificate.  It's more secure for this to be different than the main site dns.",
    default: "change me!",
    valid: valid_dns_name,
    to_val: to_trimmed_str,
    show: (conf) =>
      to_bool(conf.compute_servers_enabled) &&
      to_bool(conf.compute_servers_dns_enabled),
    tags: ["compute servers"],
  },
} as const;

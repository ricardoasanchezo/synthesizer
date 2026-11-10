terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state"
    key    = "pages/terraform.tfstate"
    region = "auto"

    endpoints = {
      s3 = "https://655946cb7aba86960f15d59a69548048.r2.cloudflarestorage.com"
    }

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type = string
}

variable "zone_id" {
  type        = string
  description = "Zone ID of iamricksanchez.com (Cloudflare dashboard -> domain -> Overview, right sidebar)"
}

resource "cloudflare_pages_project" "synth" {
  account_id        = var.cloudflare_account_id
  name              = "rust-wasm-synthesizer"
  production_branch = "main"
}

resource "cloudflare_dns_record" "synth" {
  zone_id = var.zone_id
  name    = "synthesizer"
  type    = "CNAME"
  content = cloudflare_pages_project.synth.subdomain
  ttl     = 1 # 1 = automatic, required when proxied
  proxied = true
}

resource "cloudflare_pages_domain" "synth" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.synth.name
  name         = "synthesizer.iamricksanchez.com"

  depends_on = [cloudflare_dns_record.synth]
}

output "pages_subdomain" {
  value = cloudflare_pages_project.synth.subdomain
}

output "site_url" {
  value = "https://${cloudflare_pages_domain.synth.name}"
}

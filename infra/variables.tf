variable "aws_region" {
  default = "us-west-2"
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_name" {
  description = "EC2 SSH key pair name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the app (optional, leave empty for IP-only)"
  type        = string
  default     = ""
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "openweathermap_api_key" {
  description = "OpenWeatherMap API key"
  type        = string
  default     = ""
}

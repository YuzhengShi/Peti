terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Latest Amazon Linux 2023 AMI
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC (ISB accounts have no default VPC)
resource "aws_vpc" "peti" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "peti-vpc" }
}

resource "aws_internet_gateway" "peti" {
  vpc_id = aws_vpc.peti.id
  tags   = { Name = "peti-igw" }
}

resource "aws_subnet" "peti" {
  vpc_id                  = aws_vpc.peti.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags                    = { Name = "peti-subnet" }
}

resource "aws_route_table" "peti" {
  vpc_id = aws_vpc.peti.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.peti.id
  }

  tags = { Name = "peti-rt" }
}

resource "aws_route_table_association" "peti" {
  subnet_id      = aws_subnet.peti.id
  route_table_id = aws_route_table.peti.id
}

resource "aws_security_group" "peti" {
  name        = "peti-sg"
  description = "Peti app security group"
  vpc_id      = aws_vpc.peti.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "peti-sg" }
}

resource "aws_instance" "peti" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.peti.id
  vpc_security_group_ids = [aws_security_group.peti.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    postgres_password      = var.postgres_password
    jwt_secret             = var.jwt_secret
    openweathermap_api_key = var.openweathermap_api_key
  })

  tags = { Name = "peti-app" }
}

resource "aws_eip" "peti" {
  instance = aws_instance.peti.id
  tags     = { Name = "peti-eip" }
}

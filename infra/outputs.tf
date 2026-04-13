output "public_ip" {
  value = aws_eip.peti.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_eip.peti.public_ip}"
}

output "app_url" {
  value = "http://${aws_eip.peti.public_ip}"
}

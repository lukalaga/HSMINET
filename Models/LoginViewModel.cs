﻿using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSMINET.Models
{
    [NotMapped]
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Username Required")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Password Required")]
        public string Password { get; set; }
    }
}
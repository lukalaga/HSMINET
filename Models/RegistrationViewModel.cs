using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSMINET.Models
{
    [NotMapped]
    public class RegistrationViewModel
    {
        public int RegistrationID { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }

        public string ConfirmPassword { get; set; }

        public string Gender { get; set; }

        public int? RoleID { get; set; }
        public DateTime? CreatedOn { get; set; }
    }

    public class RegistrationViewDetailsModel
    {
        public int Notifications_Id { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string Department { get; set; }
        public string Extension { get; set; }
        public string DepartmentFloor { get; set; }
    }
}
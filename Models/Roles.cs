using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HSMINET.Models
{
    public class Roles
    {
        [Key]
        public int RoleID { get; set; }

        public string RoleName { get; set; }

    }
}
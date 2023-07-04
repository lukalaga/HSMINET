using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSMINET.Models
{
    [NotMapped]
    public class IncidenceViewSummaryModel
    {
        public int Notifications_Id { get; set; }
        public string Name { get; set; }
        public string Extension { get; set; }
        public string DepartmentFloor { get; set; }
        public string DateReported { get; set; }
        public string Department { get; set; }
    }
    //Fields here populate the open ticket table
}
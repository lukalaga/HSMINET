using HSMINET.Models;
using System.Collections.Generic;

namespace HSMINET
{
    public class SingleModel
    {
        public IEnumerable<Incidence> Incidences { get; set; }
        public IEnumerable<AssignedTickets> AssignedTickets { get; set; }
        public IEnumerable<Registration> Registrations { get; set; }
    }
}
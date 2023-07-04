using Dapper;
using HSMINET.Interface;
using HSMINET.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Repository;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HSMINET.Repository
{
    public class AssignTicketsConcrete : IAssignTickets
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public AssignTicketsConcrete(IConfiguration configuration, ApplicationDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public bool CheckIsUserAssignedTicket(int RegistrationID)
        {
            var IsAssignCount = 0;
            IsAssignCount = (from assignTicket in _context.AssignedTickets
                             where assignTicket.Notifications_Id == RegistrationID
                             select assignTicket).Count();
            if (IsAssignCount > 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public List<Tickets> GetListofUnAssignedTickets()
        {
            using var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            {
                try
                {
                    var result = con.Query<Tickets>("UnassignedTickets", null, null, true, 0, System.Data.CommandType.StoredProcedure).ToList();
                    return result;
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }

        public List<AdminModel> ListOfAgents()
        {
            using var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            {
                try
                {
                    var result = con.Query<AdminModel>("ListofAgents", null, null, true, 0, System.Data.CommandType.StoredProcedure).ToList();
                    result.Insert(0, new AdminModel { Name = "---Select---" });
                    return result;
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }

        public List<Tickets> ListofTickets()
        {
            using var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
            {
                try
                {
                    var result = con.Query<Tickets>("ListOfTickets", null, null, true, 0, System.Data.CommandType.StoredProcedure).ToList();
                    return result;
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }

        public bool SaveAssignedTickets(AssignTicketsModel assignTicketsModel)
        {
            bool result;
            for (int i = 0; i < assignTicketsModel.TicketList.Count; i++)
            {
                if (assignTicketsModel.Checklist[i])
                {
                    AssignedTickets assignedTickets = new()
                    {
                        ID = 0,
                        AssignToUser = assignTicketsModel.RegistrationID,
                        CreatedOn = DateTime.Now,
                        CreatedBy = assignTicketsModel.CreatedBy,  //pass username
                        AdminCreated = assignTicketsModel.AdminCreated, //pass id
                        Status = "A",
                        Notifications_Id = assignTicketsModel.TicketList[i].Notifications_Id
                    };
                    _context.AssignedTickets.Add(assignedTickets);
                    _context.SaveChanges();
                }
            }
            result = true;
            return result;
        }
    }
}
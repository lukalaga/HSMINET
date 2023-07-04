using Dapper;
using HSMINET.Interface;
using HSMINET.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Repository;
using System;
using System.Linq;
using System.Linq.Dynamic.Core;

namespace HSMINET.Repository
{
    public class RegistrationConcrete : IRegistration
    {
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;

        public RegistrationConcrete(IConfiguration configuration, ApplicationDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public int AddUser(Registration entity)
        {
            _context.Registrations.Add(entity);
            return _context.SaveChanges();
        }

        public bool CheckUserNameExists(string Username)
        {
            var result = (from user in _context.Registrations
                          where user.Username == Username
                          select user).Count();

            if (result > 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public IQueryable<Registration> ListofRegisteredUser(string sortColumn, string sortColumnDir, string Search)
        {
            var IQueryableRegistered = (from register in _context.Registrations
                                        select register);
            if (!(string.IsNullOrEmpty(sortColumn) && string.IsNullOrEmpty(sortColumnDir)))
            {
                IQueryableRegistered = IQueryableRegistered.OrderBy(sortColumn + " " + sortColumnDir);
            }
            if (!string.IsNullOrEmpty(Search))
            {
                IQueryableRegistered = IQueryableRegistered.Where(m => m.Username.Contains(Search) || m.Name.Contains(Search));
            }

            return IQueryableRegistered;
        }

        public bool UpdatePassword(string RegistrationID, string Password)
        {
            try
            {
                using var con = new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
                {
                    var param = new DynamicParameters();
                    param.Add("@RegistrationID", RegistrationID);
                    param.Add("@Password", Password);
                    var result = con.Execute("UpdatePasswordbyRegistrationID", param, null, 0, System.Data.CommandType.StoredProcedure);
                    if (result > 0)
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        public RegistrationViewModel UserInformation(int UserID)
        {
            var result = (from user in _context.Registrations
                          select new RegistrationViewModel
                          {
                              Name = user.Name,
                              Username = user.Username,
                              Password = user.Password,
                              Email = user.Email,
                              Gender = user.Gender,
                              RoleID = user.RoleID
                          }).SingleOrDefault();
            return result;
        }
    }
}
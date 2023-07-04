using HSMINET.Interface;
using HSMINET.Models;
using Repository;
using System;
using System.Linq;

namespace HSMINET.Repository
{
    public class LoginConcrete : ILogin
    {
        private readonly ApplicationDbContext _context;

        public LoginConcrete(ApplicationDbContext context)
        {
            _context = context;
        }

        public string GetPasswordbyUserID(int UserID)
        {
            try
            {
                var Password = (from TempPass in _context.Registrations
                                where TempPass.RegistrationID == UserID
                                select TempPass.Password).FirstOrDefault();
                return Password;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public bool UpdatePassword(Registration Registration)
        {
            _context.Registrations.Attach(Registration);
            _context.Entry(Registration).Property(x => x.Password).IsModified = true;
            int result = _context.SaveChanges();
            if (result > 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public Registration ValidateUser(string userName, string Password)
        {
            try
            {
                var Validate = (from user in _context.Registrations
                                where user.Username == userName && user.Password == Password
                                select user).SingleOrDefault();
                return Validate;
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}
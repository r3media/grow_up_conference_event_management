#!/usr/bin/env python3

import requests
import sys
import json
import io
from datetime import datetime
from PIL import Image

class ConferenceAPITester:
    def __init__(self, base_url="https://confhub-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with demo credentials
        login_data = {
            "email": "admin@demo.com",
            "password": "admin123"
        }
        
        response = self.run_test(
            "Login with demo credentials",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   Logged in as: {self.user_data['name']} ({self.user_data['role']})")
            
            # Test /auth/me endpoint
            self.run_test(
                "Get current user info",
                "GET",
                "auth/me",
                200
            )
            
            return True
        else:
            print("❌ Authentication failed - cannot proceed with protected routes")
            return False

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n👥 Testing User Management...")
        
        # Test get users (requires Super Admin or Event Manager)
        users_response = self.run_test(
            "Get all users",
            "GET",
            "users",
            200
        )
        
        if users_response is None:
            print("   ⚠️  User management may require higher privileges")
            return
        
        # Test create user (requires Super Admin)
        test_user_data = {
            "name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "role": "Staff",
            "password": "testpass123",
            "is_active": True
        }
        
        created_user = self.run_test(
            "Create new user",
            "POST",
            "users",
            200,
            data=test_user_data
        )
        
        if created_user and 'id' in created_user:
            user_id = created_user['id']
            
            # Test update user
            update_data = {
                "name": "Updated Test User",
                "role": "Conference Manager"
            }
            
            self.run_test(
                "Update user",
                "PUT",
                f"users/{user_id}",
                200,
                data=update_data
            )
            
            # Test delete user
            self.run_test(
                "Delete user",
                "DELETE",
                f"users/{user_id}",
                200
            )

    def test_contact_management(self):
        """Test contact management endpoints"""
        print("\n📞 Testing Contact Management...")
        
        # Test get contacts
        contacts_response = self.run_test(
            "Get all contacts",
            "GET",
            "contacts",
            200
        )
        
        # First create a company for the contact
        test_company_data = {
            "name": "Tech Corp",
            "website": "https://techcorp.com",
            "category": "Technology"
        }
        
        company_response = self.run_test(
            "Create company for contact test",
            "POST",
            "companies",
            200,
            data=test_company_data
        )
        
        if not company_response or 'id' not in company_response:
            print("   ⚠️  Cannot create company for contact test")
            return
        
        company_id = company_response['id']
        
        # Test create contact
        test_contact_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1-555-0123",
            "company_id": company_id,
            "position": "CEO",
            "tags": ["speaker", "vip"],
            "notes": "Keynote speaker for tech conference"
        }
        
        created_contact = self.run_test(
            "Create new contact",
            "POST",
            "contacts",
            200,
            data=test_contact_data
        )
        
        if created_contact and 'id' in created_contact:
            contact_id = created_contact['id']
            
            # Test get specific contact
            self.run_test(
                "Get specific contact",
                "GET",
                f"contacts/{contact_id}",
                200
            )
            
            # Test update contact
            update_data = {
                "name": "John Smith",
                "position": "CTO",
                "tags": ["speaker", "vip", "sponsor"]
            }
            
            self.run_test(
                "Update contact",
                "PUT",
                f"contacts/{contact_id}",
                200,
                data=update_data
            )
            
            # Test delete contact
            self.run_test(
                "Delete contact",
                "DELETE",
                f"contacts/{contact_id}",
                200
            )

    def test_company_management(self):
        """Test company management endpoints"""
        print("\n🏢 Testing Company Management...")
        
        # Test get companies
        companies_response = self.run_test(
            "Get all companies",
            "GET",
            "companies",
            200
        )
        
        # Test create company
        test_company_data = {
            "name": "Innovation Labs",
            "website": "https://innovationlabs.com",
            "industry": "Technology",
            "description": "Leading technology innovation company"
        }
        
        created_company = self.run_test(
            "Create new company",
            "POST",
            "companies",
            200,
            data=test_company_data
        )
        
        if created_company and 'id' in created_company:
            company_id = created_company['id']
            
            # Test update company
            update_data = {
                "name": "Innovation Labs Inc.",
                "industry": "Software Development",
                "description": "Premier software development company"
            }
            
            self.run_test(
                "Update company",
                "PUT",
                f"companies/{company_id}",
                200,
                data=update_data
            )
            
            # Test delete company
            self.run_test(
                "Delete company",
                "DELETE",
                f"companies/{company_id}",
                200
            )

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n📊 Testing Dashboard Stats...")
        
        stats_response = self.run_test(
            "Get dashboard statistics",
            "GET",
            "stats",
            200
        )
        
        if stats_response:
            required_fields = ['total_users', 'total_contacts', 'total_companies', 'active_events']
            for field in required_fields:
                if field in stats_response:
                    print(f"   {field}: {stats_response[field]}")
                else:
                    self.log_test(f"Stats field '{field}' missing", False, f"Field not found in response")

    def create_test_image(self):
        """Create a test image for photo upload"""
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        return img_bytes.getvalue()

    def test_photo_upload(self):
        """Test photo upload functionality"""
        print("\n📸 Testing Photo Upload...")
        
        # First, get a user to test photo upload
        users_response = self.run_test(
            "Get users for photo test",
            "GET", 
            "users",
            200
        )
        
        if not users_response or len(users_response) == 0:
            print("   ⚠️  No users available for photo upload test")
            return
        
        user_id = users_response[0]['id']
        
        # Test user photo upload
        test_image = self.create_test_image()
        
        try:
            url = f"{self.api_url}/users/{user_id}/photo"
            headers = {'Authorization': f'Bearer {self.token}'}
            files = {'file': ('test_image.png', test_image, 'image/png')}
            
            response = requests.post(url, headers=headers, files=files, timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                response_data = response.json()
                photo_url = response_data.get('photo_url')
                if photo_url:
                    details += f", Photo URL: {photo_url}"
                    
                    # Test serving the uploaded photo
                    photo_response = requests.get(f"{self.base_url}{photo_url}", timeout=10)
                    if photo_response.status_code == 200:
                        self.log_test("User photo upload", True, details)
                        self.log_test("User photo serving", True, f"Photo accessible at {photo_url}")
                        
                        # Test photo deletion
                        delete_response = requests.delete(
                            f"{self.api_url}/users/{user_id}/photo",
                            headers=headers,
                            timeout=10
                        )
                        self.log_test(
                            "User photo deletion",
                            delete_response.status_code == 200,
                            f"Status: {delete_response.status_code}"
                        )
                    else:
                        self.log_test("User photo serving", False, f"Photo not accessible: {photo_response.status_code}")
                else:
                    self.log_test("User photo upload", False, "No photo_url in response")
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                self.log_test("User photo upload", False, details)
                
        except Exception as e:
            self.log_test("User photo upload", False, f"Exception: {str(e)}")
        
        # Test contact photo upload
        # First create a company for the contact
        test_company_data = {
            "name": "Photo Test Company",
            "website": "https://phototest.com",
            "category": "Technology"
        }
        
        company_response = self.run_test(
            "Create company for contact photo test",
            "POST",
            "companies",
            200,
            data=test_company_data
        )
        
        if company_response and 'id' in company_response:
            company_id = company_response['id']
            
            # Create a test contact
            test_contact_data = {
                "name": "Photo Test Contact",
                "email": "phototest@example.com",
                "company_id": company_id,
                "position": "Test Manager"
            }
            
            contact_response = self.run_test(
                "Create contact for photo test",
                "POST",
                "contacts",
                200,
                data=test_contact_data
            )
            
            if contact_response and 'id' in contact_response:
                contact_id = contact_response['id']
                
                # Test contact photo upload
                try:
                    url = f"{self.api_url}/contacts/{contact_id}/photo"
                    headers = {'Authorization': f'Bearer {self.token}'}
                    files = {'file': ('test_contact_image.png', test_image, 'image/png')}
                    
                    response = requests.post(url, headers=headers, files=files, timeout=10)
                    
                    success = response.status_code == 200
                    details = f"Status: {response.status_code}"
                    
                    if success:
                        response_data = response.json()
                        photo_url = response_data.get('photo_url')
                        if photo_url:
                            details += f", Photo URL: {photo_url}"
                            
                            # Test serving the uploaded photo
                            photo_response = requests.get(f"{self.base_url}{photo_url}", timeout=10)
                            if photo_response.status_code == 200:
                                self.log_test("Contact photo upload", True, details)
                                self.log_test("Contact photo serving", True, f"Photo accessible at {photo_url}")
                                
                                # Test photo deletion
                                delete_response = requests.delete(
                                    f"{self.api_url}/contacts/{contact_id}/photo",
                                    headers=headers,
                                    timeout=10
                                )
                                self.log_test(
                                    "Contact photo deletion",
                                    delete_response.status_code == 200,
                                    f"Status: {delete_response.status_code}"
                                )
                            else:
                                self.log_test("Contact photo serving", False, f"Photo not accessible: {photo_response.status_code}")
                        else:
                            self.log_test("Contact photo upload", False, "No photo_url in response")
                    else:
                        try:
                            error_data = response.json()
                            details += f", Error: {error_data.get('detail', 'Unknown error')}"
                        except:
                            details += f", Response: {response.text[:100]}"
                        self.log_test("Contact photo upload", False, details)
                        
                except Exception as e:
                    self.log_test("Contact photo upload", False, f"Exception: {str(e)}")
                
                # Clean up test contact
                self.run_test(
                    "Delete test contact",
                    "DELETE",
                    f"contacts/{contact_id}",
                    200
                )
            
            # Clean up test company
            self.run_test(
                "Delete test company",
                "DELETE",
                f"companies/{company_id}",
                200
            )

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔒 Testing Role-Based Access Control...")
        
        if not self.user_data:
            print("   ⚠️  No user data available for role testing")
            return
        
        user_role = self.user_data.get('role', '')
        print(f"   Current user role: {user_role}")
        
        # Test access to user management (should work for Super Admin and Event Manager)
        if user_role in ['Super Admin', 'Event Manager']:
            self.run_test(
                "Access user management (authorized role)",
                "GET",
                "users",
                200
            )
        else:
            # This should fail for other roles
            self.run_test(
                "Access user management (unauthorized role)",
                "GET",
                "users",
                403
            )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Conference Management API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication is required for all other tests
        if not self.test_authentication():
            print("\n❌ Authentication failed - stopping tests")
            return False
        
        # Run all test suites
        self.test_dashboard_stats()
        self.test_contact_management()
        self.test_company_management()
        self.test_user_management()
        self.test_photo_upload()
        self.test_role_based_access()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

    def get_test_summary(self):
        """Get detailed test summary"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = ConferenceAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_test_summary()
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
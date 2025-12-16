#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class ConferenceAPITester:
    def __init__(self, base_url="https://eventsuite-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_login(self):
        """Test login functionality"""
        print("\n=== Testing Authentication ===")
        
        success, response, status = self.make_request(
            "POST", "auth/login", 
            {"email": "admin@demo.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Login with valid credentials", True)
            return True
        else:
            self.log_test("Login with valid credentials", False, f"Status: {status}")
            return False

    def test_user_management(self):
        """Test user management features"""
        print("\n=== Testing User Management ===")
        
        # Test getting users with sorting
        success, response, status = self.make_request("GET", "users?sort_by=name&sort_order=asc")
        self.log_test("Get users with sorting (name ASC)", success, f"Status: {status}")
        
        if success:
            users = response
            print(f"   Found {len(users)} users")
            
            # Test reverse sorting
            success, response, status = self.make_request("GET", "users?sort_by=name&sort_order=desc")
            self.log_test("Get users with reverse sorting (name DESC)", success, f"Status: {status}")
            
            # Test sorting by other fields
            success, response, status = self.make_request("GET", "users?sort_by=email&sort_order=asc")
            self.log_test("Get users sorted by email", success, f"Status: {status}")
            
            success, response, status = self.make_request("GET", "users?sort_by=role&sort_order=asc")
            self.log_test("Get users sorted by role", success, f"Status: {status}")

    def test_company_management(self):
        """Test company management features"""
        print("\n=== Testing Company Management ===")
        
        # Test getting companies
        success, response, status = self.make_request("GET", "companies")
        self.log_test("Get companies", success, f"Status: {status}")
        
        if success:
            companies = response
            print(f"   Found {len(companies)} companies")
            
            # Test category filtering
            success, response, status = self.make_request("GET", "companies?category=Technology")
            self.log_test("Filter companies by category", success, f"Status: {status}")
            
            # Test exhibit history filtering
            success, response, status = self.make_request("GET", "companies?exhibit_history=Tech Expo 2024")
            self.log_test("Filter companies by exhibit history", success, f"Status: {status}")
            
            # Test sorting
            success, response, status = self.make_request("GET", "companies?sort_by=name&sort_order=asc")
            self.log_test("Sort companies by name", success, f"Status: {status}")

    def test_contact_management(self):
        """Test contact management features"""
        print("\n=== Testing Contact Management ===")
        
        # Test getting contacts
        success, response, status = self.make_request("GET", "contacts")
        self.log_test("Get contacts", success, f"Status: {status}")
        
        if success:
            contacts = response
            print(f"   Found {len(contacts)} contacts")
            
            # Test sorting
            success, response, status = self.make_request("GET", "contacts?sort_by=name&sort_order=asc")
            self.log_test("Sort contacts by name", success, f"Status: {status}")
            
            # Check if contacts have address fields
            if contacts:
                contact = contacts[0]
                has_address = 'address' in contact and contact['address'] is not None
                self.log_test("Contacts have address field support", has_address)

    def test_settings_categories(self):
        """Test settings and categories"""
        print("\n=== Testing Settings & Categories ===")
        
        # Test business categories
        success, response, status = self.make_request("GET", "settings/categories?category_type=business_category")
        self.log_test("Get business categories", success, f"Status: {status}")
        
        if success:
            business_categories = response
            print(f"   Found {len(business_categories)} business categories")
        
        # Test exhibit history categories
        success, response, status = self.make_request("GET", "settings/categories?category_type=exhibit_history")
        self.log_test("Get exhibit history categories", success, f"Status: {status}")
        
        if success:
            exhibit_categories = response
            print(f"   Found {len(exhibit_categories)} exhibit history options")

    def test_address_functionality(self):
        """Test address functionality"""
        print("\n=== Testing Address Functionality ===")
        
        # Create a test user with address to verify address handling
        test_user_data = {
            "name": "Test Address User",
            "email": f"test_address_{datetime.now().strftime('%H%M%S')}@demo.com",
            "password": "TestPass123!",
            "role": "Staff",
            "address": {
                "street": "123 Test Street",
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M5V 3A8",
                "country": "Canada"
            }
        }
        
        success, response, status = self.make_request("POST", "users", test_user_data, 200)
        self.log_test("Create user with address", success, f"Status: {status}")
        
        if success:
            user_id = response.get('id')
            
            # Update address to test country/province auto-population logic
            update_data = {
                "address": {
                    "street": "456 Updated Street",
                    "city": "New York",
                    "province": "New York",
                    "postal_code": "10001",
                    "country": "United States"
                }
            }
            
            success, response, status = self.make_request("PUT", f"users/{user_id}", update_data)
            self.log_test("Update user address (country change)", success, f"Status: {status}")
            
            # Clean up - delete test user
            success, response, status = self.make_request("DELETE", f"users/{user_id}", expected_status=200)
            self.log_test("Clean up test user", success, f"Status: {status}")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Conference Management System API Tests")
        print(f"📍 Testing against: {self.base_url}")
        
        # Login first
        if not self.test_login():
            print("❌ Login failed, cannot continue with other tests")
            return False
        
        # Run all feature tests
        self.test_user_management()
        self.test_company_management()
        self.test_contact_management()
        self.test_settings_categories()
        self.test_address_functionality()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed")
            return False

def main():
    tester = ConferenceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
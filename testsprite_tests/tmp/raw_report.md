
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** axis-admin-hub-main
- **Date:** 2026-04-29
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Administrator can sign in and reach the admin dashboard
- **Test Code:** [TC001_Administrator_can_sign_in_and_reach_the_admin_dashboard.py](./TC001_Administrator_can_sign_in_and_reach_the_admin_dashboard.py)
- **Test Error:** TEST FAILURE

Administrator login did not succeed — the user was not redirected to the admin dashboard.

Observations:
- The login page still shows the email and password fields pre-filled with the provided credentials.
- Clicking 'Entrar' earlier showed a persistent loading spinner and produced no dashboard content.
- After waiting, the page remained on the login form and did not navigate to the protected admin dashboard.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/f6c355db-8b14-46d0-9305-e7686ce38781
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Create and publish a property with CEP address lookup and images
- **Test Code:** [TC002_Create_and_publish_a_property_with_CEP_address_lookup_and_images.py](./TC002_Create_and_publish_a_property_with_CEP_address_lookup_and_images.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the test cannot proceed because login does not complete and the main application interface is not accessible.

Observations:
- Clicking 'Entrar' or submitting the form shows a central loading spinner and then the page returns to the login screen with credentials still filled.
- No error or notification is displayed on the page that explains why login failed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/66162110-cf00-42f0-b4f2-e7b8e0faf569
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Update a lead status and see it reflected in the list
- **Test Code:** [TC003_Update_a_lead_status_and_see_it_reflected_in_the_list.py](./TC003_Update_a_lead_status_and_see_it_reflected_in_the_list.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the test cannot continue because authentication did not complete and the dashboard (where Leads are managed) is not accessible.

Observations:
- After submitting the login form twice, the page returned to the login screen with the email and password still filled.
- A centered loading spinner appeared earlier but no dashboard or leads UI elements were ever displayed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/e3b2f356-1529-42b7-a190-f6b2dc0910c0
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Create a new contract with metadata and a document and see it listed
- **Test Code:** [TC004_Create_a_new_contract_with_metadata_and_a_document_and_see_it_listed.py](./TC004_Create_a_new_contract_with_metadata_and_a_document_and_see_it_listed.py)
- **Test Error:** TEST BLOCKED

Logging in could not be completed — the application returns to the login screen after submitting valid credentials.

Observations:
- After submitting credentials the page remains on the login form with the email and password pre-filled.
- No dashboard, navigation, or contract management items are visible to proceed with contract creation.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/98853a4d-88df-434b-acd2-47a5791c8c97
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Create a new client and see it listed in the directory
- **Test Code:** [TC005_Create_a_new_client_and_see_it_listed_in_the_directory.py](./TC005_Create_a_new_client_and_see_it_listed_in_the_directory.py)
- **Test Error:** TEST BLOCKED

The login failed due to invalid credentials; the test cannot proceed to add a client.

Observations:
- The page shows an error 'Erro ao fazer login' and 'Invalid login credentials'.
- The login form remains visible with the email and password filled.
- No navigation to the dashboard or client directory occurred.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/7771cc6d-4bd2-428f-934c-e25241008048
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Filter leads by status to triage the pipeline
- **Test Code:** [TC006_Filter_leads_by_status_to_triage_the_pipeline.py](./TC006_Filter_leads_by_status_to_triage_the_pipeline.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the dashboard did not load after multiple login attempts, so Lead Management cannot be accessed.

Observations:
- After submitting credentials, the page remains on the login screen with the email and password fields visible.
- Multiple submit attempts (two clicks on 'Entrar' and pressing Enter) did not navigate to the dashboard
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/759051c3-9bd0-4ecd-a270-2b46351a1bbb
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 View and update a user's role or permissions
- **Test Code:** [TC007_View_and_update_a_users_role_or_permissions.py](./TC007_View_and_update_a_users_role_or_permissions.py)
- **Test Error:** TEST BLOCKED

The test cannot continue because the application never loads the authenticated dashboard. I could not reach User Management to verify editing a user's role.

Observations:
- The login page remains visible with email and password prefilled after repeated submits.
- Clicking 'Entrar' produced a persistent loading state or returned to the login form; no dashboard or navigation links appeared.
- No User Management link or any authenticated UI was reachable from the current state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/8a410d5b-c052-47f9-9bb9-84166b62eb08
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Apply multiple lead filters and see filtered results
- **Test Code:** [TC008_Apply_multiple_lead_filters_and_see_filtered_results.py](./TC008_Apply_multiple_lead_filters_and_see_filtered_results.py)
- **Test Error:** TEST BLOCKED

The dashboard could not be reached — the test cannot proceed because login repeatedly returns to the login screen despite using the provided credentials.

Observations:
- After submitting the login form twice and sending Enter once, the app stayed on or returned to the login page with the credentials still filled.
- A central loading state was briefly shown previously but it did not resolve into the dashboard or leads view.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/ed431707-0551-4c3a-ba42-07d1bddd1484
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Search or filter the client directory to find matching clients
- **Test Code:** [TC009_Search_or_filter_the_client_directory_to_find_matching_clients.py](./TC009_Search_or_filter_the_client_directory_to_find_matching_clients.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the test cannot proceed because login did not complete and the client directory cannot be accessed.

Observations:
- Clicking 'Entrar' kept the page on the login screen after two attempts.
- The login form with email and password fields is still visible and populated.
- No client directory or navigation items are accessible from the current page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/4f114bcb-714f-4fb5-bfaa-2f975dd8775f
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Save application settings successfully
- **Test Code:** [TC010_Save_application_settings_successfully.py](./TC010_Save_application_settings_successfully.py)
- **Test Error:** TEST BLOCKED

Unable to reach the application UI because administrator login failed with the provided credentials.

Observations:
- The login page displays 'Erro ao fazer login' and 'Invalid login credentials'.
- Email and password fields were filled and the form was submitted 3 times, but login still failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/cfdbb1c7-c6b0-41a3-83f0-1ca81ecaf7cd
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Prevent saving a contract when an unsupported file type is uploaded
- **Test Code:** [TC011_Prevent_saving_a_contract_when_an_unsupported_file_type_is_uploaded.py](./TC011_Prevent_saving_a_contract_when_an_unsupported_file_type_is_uploaded.py)
- **Test Error:** TEST BLOCKED

I could not reach the contract creation UI because signing in repeatedly failed. The test cannot proceed without a successful login.

Observations:
- After submitting the login form the app either returned to the login screen or showed a persistent loading spinner.
- The login form remains visible with the provided credentials pre-filled (email: eticahostservidor@gmail.com).
- I could not access any post-login navigation or contract management pages to continue the test.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/868f628c-da0d-447a-a5ba-ed9b39798f16
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Validation blocks saving invalid application setting value
- **Test Code:** [TC012_Validation_blocks_saving_invalid_application_setting_value.py](./TC012_Validation_blocks_saving_invalid_application_setting_value.py)
- **Test Error:** TEST BLOCKED

The login could not be completed, so the application settings page could not be reached and the validation test cannot run.

Observations:
- After multiple clicks on 'Entrar', the login form remains visible with the email and password still filled.
- No dashboard, settings link, or error message appeared to explain the failure.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/91b9c4ff-d53d-4d9a-a36b-79899ef94cf3
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Required-field validation blocks saving a new property
- **Test Code:** [TC013_Required_field_validation_blocks_saving_a_new_property.py](./TC013_Required_field_validation_blocks_saving_a_new_property.py)
- **Test Error:** TEST BLOCKED

Could not log in with the provided credentials, so the property form cannot be reached and validation cannot be tested.

Observations:
- The login page displayed an error: 'Erro ao fazer login' and 'Invalid login credentials'.
- The email and password fields contain the provided credentials and the Entrar button was clicked (two attempts) but the app remained on the login screen.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/49e98023-390f-4db1-aa9f-de6d7bf3c552
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Required-field validation when creating a new user
- **Test Code:** [TC014_Required_field_validation_when_creating_a_new_user.py](./TC014_Required_field_validation_when_creating_a_new_user.py)
- **Test Error:** TEST BLOCKED

Unable to reach the User Management area because login failed with the provided credentials.

Observations:
- The login page shows 'Erro ao fazer login' and 'Invalid login credentials'.
- The app remains on the login screen with the email and password fields pre-filled.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/82ffcc72-e88f-444c-af48-453e7c048a46
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Login form validates invalid email format
- **Test Code:** [TC015_Login_form_validates_invalid_email_format.py](./TC015_Login_form_validates_invalid_email_format.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/9ecad43a-d82d-43da-b51a-15d829780665
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Cancel editing a user without persisting changes
- **Test Code:** [TC016_Cancel_editing_a_user_without_persisting_changes.py](./TC016_Cancel_editing_a_user_without_persisting_changes.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because the application did not reach the dashboard after submitting valid credentials.

Observations:
- After two attempts the login form (email, password, Entrar) remains displayed.
- Clicking 'Entrar' did not navigate to the dashboard or reveal the navigation/menu.
- The User Management page or link never appeared, so the remaining steps cannot be executed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/be338768-679f-4ce4-82ef-a61480b6866d
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Cancel settings changes without persisting
- **Test Code:** [TC017_Cancel_settings_changes_without_persisting.py](./TC017_Cancel_settings_changes_without_persisting.py)
- **Test Error:** TEST BLOCKED

Login could not be completed, so the settings page cannot be reached and the test cannot run.

Observations:
- The page shows an error banner 'Erro ao fazer login' with message 'Invalid login credentials'.
- After multiple submission attempts (5 attempts), the app remained on the login screen and did not navigate to the dashboard.
- The email and password fields are prefilled with the provided credentials but the credentials were rejected.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/41400699-4c27-4c93-95ca-40b8e656d8e9/e6196fd6-40a7-4140-ac33-e58fea3cfe2a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **5.88** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---
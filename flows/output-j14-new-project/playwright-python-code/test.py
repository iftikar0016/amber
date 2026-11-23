import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="32475de8-7ff7-4ea5-b65e-dd518e4f1b12",
    name="Create and Verify Project Persistence",
    tc_id="TC-45",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_check": "Still at it, Amber Demo?", "garden_project_listed": "true", "garden_project_persists_after_reload": "true", "kitchen_renovation_listed_after_reload": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "mosiyu", "session_value": "mosiyu", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='41231ee9-88e4-4b20-8e75-c4f4f8772343'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login form to load', instruction_id='d102e6aa-dd27-410b-bcd8-9d6b7c2fb2c3'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='0cd58006-009b-4f60-8d5d-003027960f72'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='b94eaa42-a8f7-44e2-9135-1e6435dca595'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='d9f868b9-1936-4e55-ab67-8b33b4085c33'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='e1da1679-02b1-491b-8c29-556c0de027a1'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the home page heading Still at it, Amber Demo to appear', instruction_id='e4eb74aa-4126-4699-a1cc-d61e44269ea5'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Still at it, Amber Demo?' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Reading the home page greeting'):
        set_var('home_page_greeting_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='the greeting text in the home page main heading', expected_value='Amber Demo', needs_unit_conversion=False, operator='contains', transforms=['strip'], condition='the home page greeting reads Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='31f244ba-f640-431f-bbf9-ac75562bdb87'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greeting reads Amber Demo', 'passed': True, 'operator': 'contains', 'transforms': ['strip'], 'json_path': None, 'expected': 'Amber Demo', 'extracted_value': '{{home_page_greeting_check}}', 'store_key': 'home_page_greeting_check', 'variable_refs': {'{{home_page_greeting_check}}': 'Still at it, Amber Demo?'}}], 'sub_checks': [{'description': 'the home page greeting reads Amber Demo', 'store_key': 'home_page_greeting_check', 'expected_value': 'Amber Demo', 'extracted_value': '{{home_page_greeting_check}}', 'operator': 'contains', 'transforms': ['strip']}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Projects page link', instruction_id='fe16db50-a04a-4645-8801-f48e2b414fa8'):
        _loc_3 = page.locator("internal:role=link[name=\"Projects\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking NEW PROJECT in the top-right Projects page', instruction_id='97d0bdb5-f20a-42fd-939b-894fa5ade464'):
        _loc_4 = page.locator("internal:role=link[name=\"New project\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Waiting for the queued steps to run', instruction_id='159fd138-5610-44be-b0aa-1d31669f43c7'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "Garden {{global.amber_tag}}" into "Title"', instruction_id='94823601-b8ef-46e9-a54e-d691da9a31a3'):
        element_4 = page.locator("internal:role=textbox[name=\"Title\"i]")
        variable_value_5 = var('Garden {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Clicking the Create button in the New project dialog', instruction_id='35886ecd-ba84-4d87-bade-739dd83adc39'):
        _loc_5 = page.locator("internal:role=button[name=\"Create\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Waiting for the newly created project to be available', instruction_id='45330621-4752-49bb-9dd4-24f18d8b1afc'):
        await page.wait_for_timeout(100)
    
    async with testmu.step('Clicking Projects in the main navigation', instruction_id='f4948022-5a46-4ae4-8413-45a72c382d40'):
        _loc_6 = page.locator("internal:role=link[name=\"Projects\"i]")
        
        await _loc_6.click()
    
    async with testmu.step('Checking whether the Garden {{global.amber_tag}} project is present'):
        set_var('garden_project_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).textContent.trim() === 'Garden {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Projects"i >> internal:role=link[name="Garden mosiyu"i]'], query='whether the Garden {{global.amber_tag}} project is present in the Projects navigation list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Garden {{global.amber_tag}} is listed on the Projects page.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='1c343c4e-fa21-4c80-b841-158dced9f6cf'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Garden {{global.amber_tag}} is listed on the Projects page.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{garden_project_listed}}', 'store_key': 'garden_project_listed', 'variable_refs': {'{{garden_project_listed}}': 'true', '{{global.amber_tag}}': 'mosiyu'}}], 'sub_checks': [{'description': 'Garden {{global.amber_tag}} is listed on the Projects page.', 'store_key': 'garden_project_listed', 'expected_value': 'true', 'extracted_value': '{{garden_project_listed}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Garden {{global.amber_tag}} is listed on the Projects page.'})
    
    async with testmu.step('Navigate refresh', instruction_id='a5d67cdf-2290-4c34-ad29-f07d7b6ddad1'):
        await page.reload()
    
    async with testmu.step('Waiting for the Projects page to finish reloading and confirm it is updated', instruction_id='12213a6b-9d27-483a-9817-09ef88f34ff1'):
        await page.wait_for_timeout(100)
    
    async with testmu.step('Checking whether the Garden project is listed'):
        set_var('garden_project_persists_after_reload', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).textContent.trim() === 'Garden {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Projects"i >> internal:role=link[name="Garden mosiyu"i]'], query='whether the Garden {{global.amber_tag}} project link in the Projects navigation list is present', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Garden {{global.amber_tag}} is listed on the Projects page.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Checking whether Kitchen renovation is listed'):
        set_var('kitchen_renovation_listed_after_reload', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {48: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(48).textContent.trim() === 'Kitchen renovation');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Projects"i >> internal:role=link[name="Kitchen renovation"i]'], query='whether the Kitchen renovation project link in the Projects navigation list is present', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Kitchen renovation is listed on the Projects page.'))
    
    async with testmu.step('Assertion check', instruction_id='73976c04-4fc5-4ed6-b969-bc2a21cff14b'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Garden {{global.amber_tag}} is listed on the Projects page.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{garden_project_persists_after_reload}}', 'store_key': 'garden_project_persists_after_reload', 'variable_refs': {'{{garden_project_persists_after_reload}}': 'true', '{{global.amber_tag}}': 'mosiyu'}}, {'description': 'Kitchen renovation is listed on the Projects page.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{kitchen_renovation_listed_after_reload}}', 'store_key': 'kitchen_renovation_listed_after_reload', 'variable_refs': {'{{kitchen_renovation_listed_after_reload}}': 'true'}}], 'sub_checks': [{'description': 'Garden {{global.amber_tag}} is listed on the Projects page.', 'store_key': 'garden_project_persists_after_reload', 'expected_value': 'true', 'extracted_value': '{{garden_project_persists_after_reload}}', 'operator': 'equals', 'transforms': []}, {'description': 'Kitchen renovation is listed on the Projects page.', 'store_key': 'kitchen_renovation_listed_after_reload', 'expected_value': 'true', 'extracted_value': '{{kitchen_renovation_listed_after_reload}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'The Projects page still lists Garden {{global.amber_tag}} as well as Kitchen renovation.'})


if __name__ == "__main__":
    testmu.run(test)
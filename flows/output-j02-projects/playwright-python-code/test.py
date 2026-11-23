import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="3846b9b5-e2de-4c0f-8f52-2a45dd13b5e3",
    name="Verify Project Listings After Login",
    tc_id="TC-33",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"amber_demo_home_greeting": "true", "website_relaunch_project_shown": "true", "kitchen_renovation_project_shown": "true", "reading_list_project_shown": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "gibvrw", "session_value": "gibvrw", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='2a8d4808-35ba-4592-976c-dda8c8607497'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the queued login steps to complete', instruction_id='3e03cb2d-59f0-45dd-915f-9ae0f1a26235'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='62d6ec69-db11-4304-9573-755ec2433cf8'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='e4f602e9-79ab-40f8-94a0-10eed9c52e1d'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='0e3d5daa-48b9-4306-9230-6a28f30da905'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='729fe827-67b7-4600-83f7-5cf3b773ec29'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('amber_demo_home_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether a greeting to Amber Demo is present in the home page main heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='923b4d9c-2701-473c-ac98-ee9fa2573cf3'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{amber_demo_home_greeting}}', 'store_key': 'amber_demo_home_greeting', 'variable_refs': {'{{amber_demo_home_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'amber_demo_home_greeting', 'expected_value': 'true', 'extracted_value': '{{amber_demo_home_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Projects in the main menu', instruction_id='58c48505-4a64-443d-a8c1-14faf81e723d'):
        _loc_3 = page.locator("internal:role=link[name=\"Projects\"i]")
        
        await _loc_3.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the Projects page to load', instruction_id='6e3ee69d-f625-49c5-b212-16793a7edf8e'):
            await page.wait_for_timeout(1000)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "a link labeled 'Website relaunch' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the Website relaunch project is shown'):
        set_var('website_relaunch_project_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {42: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(42).innerText.trim() === 'Website relaunch');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Projects"i >> internal:role=link[name="Website relaunch"i]'], query='whether the Website relaunch project link is present in the Projects navigation list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the project Website relaunch is shown'))
    
    async with testmu.step('Checking whether the Kitchen renovation project is shown'):
        set_var('kitchen_renovation_project_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {48: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(48).innerText.trim() === 'Kitchen renovation');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Projects"i >> internal:role=link[name="Kitchen renovation"i]'], query='whether the Kitchen renovation project link is present in the Projects navigation list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the project Kitchen renovation is shown'))
    
    async with testmu.step('Checking whether the Reading list project is shown'):
        set_var('reading_list_project_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {54: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(54).innerText.trim() === 'Reading list');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Projects"i >> internal:role=link[name="Reading list"i]'], query='whether the Reading list project link is present in the Projects navigation list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the project Reading list is shown'))
    
    async with testmu.step('Assertion check', instruction_id='f30c584c-a280-4b81-a43c-eadeec431196'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the project Website relaunch is shown', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{website_relaunch_project_shown}}', 'store_key': 'website_relaunch_project_shown', 'variable_refs': {'{{website_relaunch_project_shown}}': 'true'}}, {'description': 'the project Kitchen renovation is shown', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{kitchen_renovation_project_shown}}', 'store_key': 'kitchen_renovation_project_shown', 'variable_refs': {'{{kitchen_renovation_project_shown}}': 'true'}}, {'description': 'the project Reading list is shown', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{reading_list_project_shown}}', 'store_key': 'reading_list_project_shown', 'variable_refs': {'{{reading_list_project_shown}}': 'true'}}], 'sub_checks': [{'description': 'the project Website relaunch is shown', 'store_key': 'website_relaunch_project_shown', 'expected_value': 'true', 'extracted_value': '{{website_relaunch_project_shown}}', 'operator': 'equals', 'transforms': []}, {'description': 'the project Kitchen renovation is shown', 'store_key': 'kitchen_renovation_project_shown', 'expected_value': 'true', 'extracted_value': '{{kitchen_renovation_project_shown}}', 'operator': 'equals', 'transforms': []}, {'description': 'the project Reading list is shown', 'store_key': 'reading_list_project_shown', 'expected_value': 'true', 'extracted_value': '{{reading_list_project_shown}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the projects Website relaunch, Kitchen renovation and Reading list are all shown'})


if __name__ == "__main__":
    testmu.run(test)
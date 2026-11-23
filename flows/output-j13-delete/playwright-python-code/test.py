import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="aedf9705-90de-48c3-9fd0-80774a133ee1",
    name="Delete and Verify Task Removal in Project",
    tc_id="TC-42",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "pick_a_colour_palette_absent_from_website_relaunch_list": "false", "pick_a_colour_palette_still_gone": "false", "set_up_analytics_listed": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "vnbcql", "session_value": "vnbcql", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='79abb139-59b4-4db6-8caf-37e0e32ad687'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for login form steps to complete', instruction_id='24c663e4-152b-41c6-8aa9-ca50bbefc7a1'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='f0197ec8-078e-4cc3-a33e-ade00438e13c'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='9224d610-4ca9-45bf-9be1-1140d0f56d3c'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='6b7e5923-e8be-4b92-b43d-cb5502d41f0a'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='2ae532e5-b22f-4ec5-b618-7f3897f71f11'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading contains Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='b89fc14e-7a1f-4e24-8012-5afc38dc3423'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Website relaunch in the project list navigation', instruction_id='911cbddc-c950-4e1d-8c2a-88968b4a3aae'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Website relaunch\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Pick a colour palette task link', instruction_id='93bcd6a0-932c-44fc-9ef4-f9b80e22b6e7'):
        _loc_4 = page.locator("internal:role=link[name=\"Pick a colour palette\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Scroll into view: PRIMARY: Delete the task Pick a colour palette; role=button; text="DELETE" | HINTS: container=task detail sidebar', instruction_id='3bfdc5b0-ce41-4f92-abb7-7b8abdac62e2'):
        element_4 = page.locator("internal:role=button[name=\"Delete\"i]")
        await element_4.evaluate("el => el.scrollIntoView({block: 'center'})")
    
    async with testmu.step('Clicking Delete for the selected task', instruction_id='b38ed106-b528-4634-b0a7-50565bfc2de4'):
        _loc_5 = page.locator("internal:role=button[name=\"Delete\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('whether Pick a colour palette is present in the visible Website relaunch task list', instruction_id='ef7ad646-17d2-47f9-92be-6d8afae17608'):
        set_var('pick_a_colour_palette_absent_from_website_relaunch_list', await testmu.vision_query(page, "whether Pick a colour palette is present in the visible Website relaunch task list", ""))
    
    async with testmu.step('Assertion check', instruction_id='e486095b-c2b5-46e1-8be8-c286cf6c3562'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the Website relaunch list no longer shows Pick a colour palette.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'false', 'extracted_value': '{{pick_a_colour_palette_absent_from_website_relaunch_list}}', 'store_key': 'pick_a_colour_palette_absent_from_website_relaunch_list', 'variable_refs': {'{{pick_a_colour_palette_absent_from_website_relaunch_list}}': 'false'}}], 'sub_checks': [{'description': 'the Website relaunch list no longer shows Pick a colour palette.', 'store_key': 'pick_a_colour_palette_absent_from_website_relaunch_list', 'expected_value': 'false', 'extracted_value': '{{pick_a_colour_palette_absent_from_website_relaunch_list}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the Website relaunch list no longer shows Pick a colour palette.'})
    
    async with testmu.step('Navigate refresh', instruction_id='ef18c192-422f-4edd-8714-317573490ac7'):
        await page.reload()
    
    async with testmu.step('Waiting for the page to reload', instruction_id='b53909f1-6370-4ddb-8ca0-ace43f8e18c6'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('whether Pick a colour palette is present in the Website relaunch task list', instruction_id='1899ad7c-9617-4f6f-b8d6-c26a7130cb09'):
        set_var('pick_a_colour_palette_still_gone', await testmu.vision_query(page, "whether Pick a colour palette is present in the Website relaunch task list", ""))
    
    async with testmu.step('Checking whether Set up analytics is present'):
        set_var('set_up_analytics_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {95: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(95).textContent.trim() === 'Set up analytics');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Set up analytics"i]'], query='whether Set up analytics is present in the Website relaunch task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Set up analytics is still listed.'))
    
    async with testmu.step('Assertion check', instruction_id='39c1f1cf-1328-4dff-b3c2-97ae2a957f7b'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Pick a colour palette is still gone.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'false', 'extracted_value': '{{pick_a_colour_palette_still_gone}}', 'store_key': 'pick_a_colour_palette_still_gone', 'variable_refs': {'{{pick_a_colour_palette_still_gone}}': 'false'}}, {'description': 'Set up analytics is still listed.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{set_up_analytics_listed}}', 'store_key': 'set_up_analytics_listed', 'variable_refs': {'{{set_up_analytics_listed}}': 'true'}}], 'sub_checks': [{'description': 'Pick a colour palette is still gone.', 'store_key': 'pick_a_colour_palette_still_gone', 'expected_value': 'false', 'extracted_value': '{{pick_a_colour_palette_still_gone}}', 'operator': 'equals', 'transforms': []}, {'description': 'Set up analytics is still listed.', 'store_key': 'set_up_analytics_listed', 'expected_value': 'true', 'extracted_value': '{{set_up_analytics_listed}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Pick a colour palette is still gone and Set up analytics is still listed.'})


if __name__ == "__main__":
    testmu.run(test)
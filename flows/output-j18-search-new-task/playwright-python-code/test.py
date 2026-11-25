import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="08976795-1bba-4f5f-b7c6-afa016ae3e6e",
    name="Create and Verify Task Persistence",
    tc_id="TC-72",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting": "Fresh start, Amber Demo", "buy_sealant_title_shown": "Buy sealant fggucf | Vikunja", "buy_sealant_title_still_shown": "Buy sealant fggucf | Vikunja"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "fggucf", "session_value": "fggucf", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='a84f77cb-6633-4271-8866-1b109755798b'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the plan steps to complete', instruction_id='05dfa275-a554-4af8-aaa2-51feda885b32'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='18b8108e-478a-4537-b94f-c00e2760f7d1'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='6502c342-739a-48da-a182-7ed5b99e087d'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='f4db0181-f7b2-4722-8fc6-80b2b85277d5'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='828974e6-2ce4-41ce-aa76-b81e8dc307a8'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Reading the home page greeting'):
        set_var('home_page_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Fresh start, Amber Demo"i]'], query='the greeting heading in the main content area', expected_value='Amber Demo', needs_unit_conversion=False, operator='contains', transforms=['strip'], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='d256ba1f-70da-4896-9cc1-589907251bad'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'contains', 'transforms': ['strip'], 'json_path': None, 'expected': 'Amber Demo', 'extracted_value': '{{home_page_greeting}}', 'store_key': 'home_page_greeting', 'variable_refs': {'{{home_page_greeting}}': 'Fresh start, Amber Demo'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting', 'expected_value': 'Amber Demo', 'extracted_value': '{{home_page_greeting}}', 'operator': 'contains', 'transforms': ['strip']}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the left project list', instruction_id='63befc7a-08b3-416e-b46b-85a586d58367'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Waiting for the plan button to be clicked', instruction_id='a74bc942-f1c4-4a90-98e7-13f7a2153734'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "Buy sealant {{global.amber_tag}}" into "Add a task…"', instruction_id='bb14b051-909b-4ef4-af8a-fa73e5e13f35'):
        element_4 = page.locator("internal:role=textbox[name=\"Add a task…\"i]")
        variable_value_5 = var('Buy sealant {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Click "Add"', instruction_id='90af6477-914b-49e8-a195-d34916d51d9d'):
        _loc_4 = page.locator("internal:role=button[name=\"Add\"s]")
        
        await _loc_4.click()
    
    async with testmu.step('Confirming the new Kitchen renovation task is present', instruction_id='7aa91232-7857-4d76-9929-0062cb5c02be'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Clicking the top bar search to search for {{global.amber_tag}}', instruction_id='8fd636c1-e446-46b0-94f9-ca63ce827443'):
        _loc_5 = page.locator("internal:role=button[name=\"Open the search/quick action\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Typing {{global.amber_tag}} into the top bar search box', instruction_id='a7b77acc-8ca4-4d6d-9e2c-0a32eb76712b'):
        element_6 = page.locator("internal:role=textbox[name=\"Type a command or search…\"i]")
        variable_value_7 = var('{{global.amber_tag}}')
        
        await testmu.fill(element_6, variable_value_7)
    
    async with testmu.step('PRIMARY: open Buy sealant {{global.amber_tag}} from the results', instruction_id='81c2ec9f-8bdc-4604-8c9d-15dbda7240bb'):
        _loc_6 = page.locator("internal:role=button[name=\"Kitchen renovation Buy\"i]")
        
        await _loc_6.click(reprobe=True)
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the task page to load', instruction_id='63529c9b-2cf9-4779-b3f3-b90fb93e3959'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Title' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking the current page title', instruction_id='2596702a-dcf4-424a-8aca-b418b130b27c'):
        set_var('buy_sealant_title_shown', await page.title())
    
    async with testmu.step('Assertion check', instruction_id='95d69960-1ca7-45fd-bf13-eb1f251f84f7'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'The opened task page shows the title Buy sealant {{global.amber_tag}}.', 'passed': True, 'operator': 'contains', 'transforms': [], 'json_path': None, 'expected': 'Buy sealant fggucf', 'extracted_value': '{{buy_sealant_title_shown}}', 'store_key': 'buy_sealant_title_shown', 'variable_refs': {'{{buy_sealant_title_shown}}': 'Buy sealant fggucf | Vikunja', '{{global.amber_tag}}': 'fggucf'}}], 'sub_checks': [{'description': 'The opened task page shows the title Buy sealant {{global.amber_tag}}.', 'store_key': 'buy_sealant_title_shown', 'expected_value': 'Buy sealant fggucf', 'extracted_value': '{{buy_sealant_title_shown}}', 'operator': 'contains', 'transforms': []}], 'composite_operator': 'and', 'claim': 'its page shows the title Buy sealant {{global.amber_tag}}'})
    
    async with testmu.step('Navigate refresh', instruction_id='3d8697ac-e3c4-41b3-abf5-69467e13923c'):
        await page.reload()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the reloaded task page to load', instruction_id='1de5e8c9-b434-4515-9f70-364316dd176c'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Title' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Reading the current page title', instruction_id='dc42311d-d0a4-428e-b3c7-38e3b5c63753'):
        set_var('buy_sealant_title_still_shown', await page.title())
    
    async with testmu.step('Assertion check', instruction_id='d11c23cf-f5b3-4e1a-becd-cdab629635f4'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'After reloading, the page still shows the title Buy sealant {{global.amber_tag}}.', 'passed': True, 'operator': 'contains', 'transforms': [], 'json_path': None, 'expected': 'Buy sealant fggucf', 'extracted_value': '{{buy_sealant_title_still_shown}}', 'store_key': 'buy_sealant_title_still_shown', 'variable_refs': {'{{buy_sealant_title_still_shown}}': 'Buy sealant fggucf | Vikunja', '{{global.amber_tag}}': 'fggucf'}}], 'sub_checks': [{'description': 'After reloading, the page still shows the title Buy sealant {{global.amber_tag}}.', 'store_key': 'buy_sealant_title_still_shown', 'expected_value': 'Buy sealant fggucf', 'extracted_value': '{{buy_sealant_title_still_shown}}', 'operator': 'contains', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the title Buy sealant {{global.amber_tag}} is still shown'})


if __name__ == "__main__":
    testmu.run(test)
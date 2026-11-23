import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="e3556134-400b-443f-9660-592a830151f5",
    name="Edit and Verify Homepage Copy Task",
    tc_id="TC-40",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_amber_demo_greeting": "true", "homepage_copy_amber_tag_listed": "true", "homepage_copy_amber_tag_still_listed": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "imwezs", "session_value": "imwezs", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='b9268b51-dee8-4db6-8280-f2f111cb4904'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the next login step', instruction_id='cfa57dbe-2043-4165-9052-f89862fda0f9'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='b8707a19-7cf3-4529-9803-4dbd8276b23c'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='93d96bcd-cb86-407d-937d-117d6c8e1fc1'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='368b9549-58c7-4524-a7f9-e26f1539cc7f'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='840816d8-d16e-4ef6-9244-f9ab902c41a9'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the home page greeting to load', instruction_id='f3e16cc2-336e-44ff-83de-cd690dcd81a1'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the heading 'Still at it, Amber Demo?' is visible"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_amber_demo_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading in the main content greets Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='14b2ba94-94f7-4914-ba40-5017ec3cfef3'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'store_key': 'home_page_amber_demo_greeting', 'variable_refs': {'{{home_page_amber_demo_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_amber_demo_greeting', 'expected_value': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking the Website relaunch link in the left projects sidebar', instruction_id='e660f887-ba22-46d0-94d8-ad244136efa0'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Website relaunch\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Write homepage copy in the task list', instruction_id='aaff3543-8127-4901-aa9d-f87ff2fe6779'):
        _loc_4 = page.locator("internal:role=link[name=\"Write homepage copy\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Clicking the Title heading to change the task title', instruction_id='81857a76-9d76-4d54-b381-3ed6a9e035c9'):
        _loc_5 = page.locator("internal:role=heading[name=\"Title\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Typing Homepage copy in the task title field', instruction_id='d5da08f8-7288-4962-9ec8-825a20725300'):
        element_4 = page.locator("internal:role=heading[name=\"Title\"i]")
        variable_value_5 = var('Homepage copy {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Clicking Back to project', instruction_id='0fd96db2-03ea-42a4-976d-abe20ec9de35'):
        _loc_6 = page.locator("internal:role=button[name=\"Back to project\"i]")
        
        await _loc_6.click()
    
    async with testmu.step('Checking whether the Homepage copy task is listed'):
        set_var('homepage_copy_amber_tag_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {107: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(107).innerText.trim() === 'Homepage copy {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Homepage copy imwezs"i]'], query='whether the task link "Homepage copy {{global.amber_tag}}" is present in the Website relaunch list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Homepage copy {{global.amber_tag}} is listed in the Website relaunch list.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='b733c03d-465a-4ccc-bdff-f272078e2724'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Homepage copy {{global.amber_tag}} is listed in the Website relaunch list.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{homepage_copy_amber_tag_listed}}', 'store_key': 'homepage_copy_amber_tag_listed', 'variable_refs': {'{{homepage_copy_amber_tag_listed}}': 'true', '{{global.amber_tag}}': 'imwezs'}}], 'sub_checks': [{'description': 'Homepage copy {{global.amber_tag}} is listed in the Website relaunch list.', 'store_key': 'homepage_copy_amber_tag_listed', 'expected_value': 'true', 'extracted_value': '{{homepage_copy_amber_tag_listed}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Homepage copy {{global.amber_tag}} is listed.'})
    
    async with testmu.step('Navigate refresh', instruction_id='233ef478-77a3-4aaa-848a-3cf8ee08e4f8'):
        await page.reload()
    
    async with testmu.step('Checking whether the Homepage copy task is listed'):
        set_var('homepage_copy_amber_tag_still_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {107: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(107).innerText.trim() === 'Homepage copy {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Homepage copy imwezs"i]'], query='whether the task Homepage copy {{global.amber_tag}} is present in the Website relaunch task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Homepage copy {{global.amber_tag}} is still listed in the Website relaunch list.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='88b3cc1a-2bea-4eb7-b601-b0f1f8277008'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Homepage copy {{global.amber_tag}} is still listed in the Website relaunch list.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{homepage_copy_amber_tag_still_listed}}', 'store_key': 'homepage_copy_amber_tag_still_listed', 'variable_refs': {'{{homepage_copy_amber_tag_still_listed}}': 'true', '{{global.amber_tag}}': 'imwezs'}}], 'sub_checks': [{'description': 'Homepage copy {{global.amber_tag}} is still listed in the Website relaunch list.', 'store_key': 'homepage_copy_amber_tag_still_listed', 'expected_value': 'true', 'extracted_value': '{{homepage_copy_amber_tag_still_listed}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Homepage copy {{global.amber_tag}} is still listed.'})


if __name__ == "__main__":
    testmu.run(test)
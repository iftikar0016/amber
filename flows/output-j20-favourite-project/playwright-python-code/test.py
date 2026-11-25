import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="427c1de5-b392-441b-a090-e3b319cf0b9c",
    name="Mark Project as Favorite and Verify Persistence",
    tc_id="TC-77",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_amber_demo_greeting": "true", "reading_list_favorite_project_check": "true", "reading_list_favorite_project_persisted_check": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "vzefyf", "session_value": "vzefyf", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='33871b45-05c8-4560-a32b-703c98ac9c77'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login form steps to finish', instruction_id='aed375a2-30af-4f97-a4a5-8f7decd29f98'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='c5abef55-5c53-4ec0-98e2-5b890382a632'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='29f2356c-d048-4a81-a4c5-826eb50cceba'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='d9b46227-c920-4934-9a30-b7282a3fb96d'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='21789c86-409f-4921-995d-d00b8f22830f'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_amber_demo_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim() === 'Fresh start, Amber Demo');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Fresh start, Amber Demo"i]'], query='whether the home page greeting Amber Demo is present in the main heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='4862a23f-990c-48f8-baea-676b460b3fe8'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'store_key': 'home_page_amber_demo_greeting', 'variable_refs': {'{{home_page_amber_demo_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_amber_demo_greeting', 'expected_value': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step("Hover over 'the project Reading list in the main menu on the left'", instruction_id='88d72946-9a36-49b5-a47c-34123b6430e6'):
        coords = await testmu.get_vision_coordinates(page, "Hover over 'the project Reading list in the main menu on the left'", "click", 960, 540)
        await page.mouse.move(coords['x'], coords['y'])
        
    
    async with testmu.step('PRIMARY: In the main menu on the left, hover over the project Reading list and click the star button beside its name, labelled Mark this project as favorite; role=button; text="Mark this project as favorite" | HINTS: container=Projects navigation menu; immediately beside the Reading list row', instruction_id='c5b1f3a1-9884-4045-be0c-d4c5d786a2b2'):
        coords = await testmu.get_vision_coordinates(page, 'PRIMARY: In the main menu on the left, hover over the project Reading list and click the star button beside its name, labelled Mark this project as favorite; role=button; text="Mark this project as favorite" | HINTS: container=Projects navigation menu; immediately beside the Reading list row', "click", 247, 572)
        await page.mouse.click(coords['x'], coords['y'])
        
    
    async with testmu.step('Checking whether Reading list is present in the Favorites menu'):
        set_var('reading_list_favorite_project_check', await testmu.textual_analyzer(page, wrapped_js='(els) => {\n  const __m = {29: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(29).textContent.trim() === \'Reading list\' && !!el(29).closest(\'nav[aria-label="Favorites"], nav\'));\n  return (typeof __v === \'boolean\' ? String(__v) : __v);\n}', locators=['internal:label="Favorites"i >> internal:role=link[name="Reading list"i]'], query='whether the Reading list project is listed in the Favorites navigation menu', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Reading list is listed as a favorite project in the main menu'))
    
    async with testmu.step('Assertion check', instruction_id='18737116-993a-4af7-8bf4-6be4e4b367e4'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Reading list is listed as a favorite project in the main menu', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{reading_list_favorite_project_check}}', 'store_key': 'reading_list_favorite_project_check', 'variable_refs': {'{{reading_list_favorite_project_check}}': 'true'}}], 'sub_checks': [{'description': 'Reading list is listed as a favorite project in the main menu', 'store_key': 'reading_list_favorite_project_check', 'expected_value': 'true', 'extracted_value': '{{reading_list_favorite_project_check}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Reading list is listed as a favorite project in the main menu'})
    
    async with testmu.step('Navigate refresh', instruction_id='c425bd01-8870-4d2d-8554-310b799e21db'):
        await page.reload()
    
    async with testmu.step('Reloading the page', instruction_id='f076789d-7f39-4705-a260-bfa6651c1ec7'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Checking whether Reading list is listed as a favorite project'):
        set_var('reading_list_favorite_project_persisted_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {27: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(27).querySelector('a')?.textContent.trim() === 'Reading list' && /Remove this project from favorites/i.test(el(27).innerText));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:label="Favorites"i >> internal:role=listitem >> internal:has-text="Reading listRemove this"i'], query='whether the Reading list item in the Favorites navigation is listed as a favorite project', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Reading list is still listed as a favorite project'))
    
    async with testmu.step('Assertion check', instruction_id='b78132c4-6407-464e-b8cd-f2b2989c8ac5'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Reading list is still listed as a favorite project', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{reading_list_favorite_project_persisted_check}}', 'store_key': 'reading_list_favorite_project_persisted_check', 'variable_refs': {'{{reading_list_favorite_project_persisted_check}}': 'true'}}], 'sub_checks': [{'description': 'Reading list is still listed as a favorite project', 'store_key': 'reading_list_favorite_project_persisted_check', 'expected_value': 'true', 'extracted_value': '{{reading_list_favorite_project_persisted_check}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Reading list is still listed as a favorite project'})


if __name__ == "__main__":
    testmu.run(test)
import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="bf586a73-77dd-4ca5-9c0a-67d31c093a38",
    name="Verify Interaction Replay Completion",
    tc_id="TC-95",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"initial_interactions_line": "0 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF", "completed_interactions_line": "21 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "gvshta", "session_value": "gvshta", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/amber/?t=start&speed=10', instruction_id='5477328f-05ea-4b12-9057-bda7eec4296e'):
        await page.goto("http://127.0.0.1:4790/amber/?t=start&speed=10")
    
    async with testmu.step('Reading the interactions proof line'):
        set_var('initial_interactions_line', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {2: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(2).innerText);\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="0 of 21 interactions proven"i'], query='the interactions proof line above the journeys block', expected_value='0 of 21 interactions proven with the server off', needs_unit_conversion=False, operator='equals', transforms=['strip', 'lowercase'], condition='the line above the block reads 0 of 21 interactions proven with the server off'))
    
    async with testmu.step('Assertion check', instruction_id='22d34781-32df-4264-89e5-e31246258c74'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the line above the block reads 0 of 21 interactions proven with the server off', 'passed': True, 'operator': 'equals', 'transforms': ['strip', 'lowercase'], 'json_path': None, 'expected': '0 of 21 interactions proven with the server off', 'extracted_value': '{{initial_interactions_line}}', 'store_key': 'initial_interactions_line', 'variable_refs': {'{{initial_interactions_line}}': '0 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF'}}], 'sub_checks': [{'description': 'the line above the block reads 0 of 21 interactions proven with the server off', 'store_key': 'initial_interactions_line', 'expected_value': '0 of 21 interactions proven with the server off', 'extracted_value': '{{initial_interactions_line}}', 'operator': 'equals', 'transforms': ['strip', 'lowercase']}], 'composite_operator': 'and', 'claim': 'the line above the block reads 0 of 21 interactions proven with the server off'})
    
    async with testmu.step('Clicking the REPLAY THE RUN button', instruction_id='5ed09d90-d496-4188-88bd-1707edda87d4'):
        _loc_1 = page.locator("internal:role=button[name=\"Replay the run\"i]")
        
        await _loc_1.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for 21 of 21 interactions with the server turned off', instruction_id='a61530a6-1b18-4ca1-8d6d-dfa7db34f66f'):
            await page.wait_for_timeout(1000)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the line above the block reads '21 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF'"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Reading the completed interactions status line'):
        set_var('completed_interactions_line', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {2: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(2).innerText);\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="21 of 21 interactions proven"i'], query='the completed interactions status line above the journeys block', expected_value='21 of 21 interactions proven with the server off', needs_unit_conversion=False, operator='equals', transforms=['strip', 'lowercase'], condition='the line above the block reads 21 of 21 interactions proven with the server off'))
    
    async with testmu.step('Assertion check', instruction_id='c0b60d09-d1a0-4a63-a5e6-4d15bc7fc017'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the line above the block reads 21 of 21 interactions proven with the server off', 'passed': True, 'operator': 'equals', 'transforms': ['strip', 'lowercase'], 'json_path': None, 'expected': '21 of 21 interactions proven with the server off', 'extracted_value': '{{completed_interactions_line}}', 'store_key': 'completed_interactions_line', 'variable_refs': {'{{completed_interactions_line}}': '21 OF 21 INTERACTIONS PROVEN WITH THE SERVER OFF'}}], 'sub_checks': [{'description': 'the line above the block reads 21 of 21 interactions proven with the server off', 'store_key': 'completed_interactions_line', 'expected_value': '21 of 21 interactions proven with the server off', 'extracted_value': '{{completed_interactions_line}}', 'operator': 'equals', 'transforms': ['strip', 'lowercase']}], 'composite_operator': 'and', 'claim': 'the line above the block reads 21 of 21 interactions proven with the server off'})


if __name__ == "__main__":
    testmu.run(test)
import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="81002583-ffb2-4cd5-a676-8648b19ef519",
    name="Verify Interaction Replay with Server Off",
    tc_id="TC-67",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"interactions_proven_initial_count": "0 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF", "interactions_proven_final_count": "15 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "ilumpt", "session_value": "ilumpt", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/amber/?t=start&speed=10', instruction_id='e7580b3d-72d1-48be-8541-3734287843eb'):
        await page.goto("http://127.0.0.1:4790/amber/?t=start&speed=10")
    
    async with testmu.step('Reading the interactions-proven count'):
        set_var('interactions_proven_initial_count', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {2: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(2).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="0 of 15 interactions proven"i'], query='the interactions-proven count line above the journeys block', expected_value='0 of 15 interactions proven with the server off', needs_unit_conversion=False, operator='equals', transforms=['strip', 'lowercase'], condition='the line above the block reads 0 of 15 interactions proven with the server off'))
    
    async with testmu.step('Assertion check', instruction_id='2bea9148-5808-45a1-8808-0f48d9c63c23'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the line above the block reads 0 of 15 interactions proven with the server off', 'passed': True, 'operator': 'equals', 'transforms': ['strip', 'lowercase'], 'json_path': None, 'expected': '0 of 15 interactions proven with the server off', 'extracted_value': '{{interactions_proven_initial_count}}', 'store_key': 'interactions_proven_initial_count', 'variable_refs': {'{{interactions_proven_initial_count}}': '0 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF'}}], 'sub_checks': [{'description': 'the line above the block reads 0 of 15 interactions proven with the server off', 'store_key': 'interactions_proven_initial_count', 'expected_value': '0 of 15 interactions proven with the server off', 'extracted_value': '{{interactions_proven_initial_count}}', 'operator': 'equals', 'transforms': ['strip', 'lowercase']}], 'composite_operator': 'and', 'claim': 'the line above the block reads 0 of 15 interactions proven with the server off'})
    
    async with testmu.step('Clicking the Replay the run button', instruction_id='fdf09fef-5e07-422d-a82d-8106367cf5dd'):
        _loc_1 = page.locator("internal:role=button[name=\"Replay the run\"i]")
        
        await _loc_1.click()
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting until interactions proven reaches 15 of 15 with server off', instruction_id='bd097203-a303-4872-9bac-01b1051f0db6'):
            await page.wait_for_timeout(1000)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, "the line above the block reads '15 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF'"):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('the line above the block reads 15 of 15 interactions proven with the server off', instruction_id='9c1b2df5-1551-4e40-92a6-c856c270dc0f'):
        set_var('interactions_proven_final_count', await testmu.vision_query(page, "the line above the block reads 15 of 15 interactions proven with the server off", ""))
    
    async with testmu.step('Assertion check', instruction_id='60df84b2-5913-49cd-b776-837c45cfc2e4'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the line above the block reads 15 of 15 interactions proven with the server off', 'passed': True, 'operator': 'equals', 'transforms': ['lowercase'], 'json_path': None, 'expected': '15 of 15 interactions proven with the server off', 'extracted_value': '{{interactions_proven_final_count}}', 'store_key': 'interactions_proven_final_count', 'variable_refs': {'{{interactions_proven_final_count}}': '15 OF 15 INTERACTIONS PROVEN WITH THE SERVER OFF'}}], 'sub_checks': [{'description': 'the line above the block reads 15 of 15 interactions proven with the server off', 'store_key': 'interactions_proven_final_count', 'expected_value': '15 of 15 interactions proven with the server off', 'extracted_value': '{{interactions_proven_final_count}}', 'operator': 'equals', 'transforms': ['lowercase']}], 'composite_operator': 'and', 'claim': 'the line above the block reads 15 of 15 interactions proven with the server off'})


if __name__ == "__main__":
    testmu.run(test)
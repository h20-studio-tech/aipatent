from shiny import reactive, render, ui
import shiny
import asyncio
from make_patent_component import (
    langfuse,
    generate_primary_invention,
    generate_field_of_invention,
    generate_background_and_need,
    generate_brief_summary,
    generate_technology_platform,
    generate_description_of_invention,
    generate_product_or_products,
    generate_uses
)   
import logging


logging.basicConfig(level=logging.INFO)

# Define UI
app_ui = ui.page_fluid(
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_text_area(
                "antigen", 
                "Enter Antigen",
                resize="vertical",
            ),
            ui.input_text_area(
                "disease", 
                "Enter Disease",
                resize="vertical",
            ),
            ui.input_action_button("generate", "Generate", class_="btn btn-primary"),
        ),

        ui.card(
            ui.output_ui("primary_invention_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("field_of_invention_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("background_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("summary_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("technology_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("description_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("product_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        ui.card(
            ui.output_ui("uses_card", height="100%", padding="0"),
            min_height="50%",
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        height="100vh",
    )
)

def generate_card_content(response_text, generation_step):
    response_text = str(response_text)
    step_id = generation_step.lower().replace(" ", "_")

    return ui.div(
        ui.div(
            ui.input_text_area(
                f"{step_id}", 
                generation_step, 
                value=response_text, 
                width="100%", 
                height="100%", 
                rows=8,
                resize="none"
            ),
            class_="card-body h-100"
        ),
        ui.div(
            ui.input_action_button(
                f"thumbs_up_{step_id}", 
                "👍", 
                class_="btn btn-success p-0", 
                width="3vw",
                disabled=True
            ),
            ui.popover(
                ui.input_action_button(
                    f"thumbs_down_{step_id}", 
                    "👎", 
                    class_="btn btn-danger p-0", 
                    width="3vw",
                    disabled=True
                ),
                ui.input_text_area(
                    f"reasoning_thumbs_down_{step_id}",
                    "thumbs down feedback",
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder="Please provide your feedback about what you didn't like or what could be improved.",
                ),
                ui.input_action_button(
                    f"save_reasoning_thumbs_down_{step_id}", 
                    "📝", 
                    class_="btn btn-secondary p-0", 
                    width="3vw"
                ),
                id=f"thumbs_down_popover_{step_id}"
            ),
            ui.popover(
                ui.input_action_button(
                    f"save_{step_id}", "💾 ", 
                    class_="btn btn-secondary p-0", 
                    width="3vw", 
                    disabled=True
                ),
                ui.input_text_area(
                    f"reasoning_{step_id}", 
                    generation_step,
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder="Please provide reasoning for your edits and/or feedback if applicable. this will help us improve the quality of our LLM",
                ),
                ui.input_action_button(
                    f"save_reasoning_{step_id}", 
                    "📝", 
                    class_="btn btn-secondary p-0", 
                    width="3vw"
                ),
                id=f"{step_id}_popover"
            ),
            ui.input_action_button(
                f"{step_id}_continue",
                "➡️",
                class_="btn btn-primary p-0",
                width="3vw",
                disabled=True
            ),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )

shared_state = {
    "primary_invention_trace": None,
    "field_of_invention_trace": None,
    "background_and_need_trace": None,
    "brief_summary_trace": None,
    "technology_platform_trace": None,
    "description_of_invention_trace": None,
    "product_or_products_trace": None,
    "uses_trace": None
}
# Define Server Logic
def server(input, output, session):
    # Create a reactive value to store the generated primary invention
    generated_primary_invention = reactive.Value("")
    generated_field_of_invention = reactive.Value("")
    generated_background = reactive.Value("")
    generated_summary = reactive.Value("")
    generated_technology = reactive.Value("")
    generated_description = reactive.Value("")
    generated_product = reactive.Value("")
    generated_uses = reactive.Value("")

    @reactive.Effect
    @reactive.event(input.generate)
    def on_generate():
        # Collect input values
        antigen = input.antigen()
        disease = input.disease()

        ui.update_action_button("thumbs_up_primary_invention", disabled=False)
        ui.update_action_button("thumbs_down_primary_invention", disabled=False)
        ui.update_action_button("primary_invention_continue", disabled=False)

        if not antigen and not disease:
            ui.notification_show("missing antigen and disease", duration=2, type="error")
            return 
        if not antigen:
            ui.notification_show("missing antigen", duration=2, type="error")
            return 
        if not disease:
            ui.notification_show("missing disease", duration=2, type="error")
            return 

        # Log the collected inputs for debugging
        logging.info(f"Antigen: {antigen}")
        logging.info(f"Disease: {disease}")

        # Placeholder response
        response = generate_primary_invention(antigen, disease)

        shared_state["primary_invention_trace"] = langfuse.trace(id=response.trace_id)

        # Debugging: Log the response
        logging.info(f"Generated primary invention")

        generated_primary_invention.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.primary_invention_continue)
    def on_primary_invention_continue():
        primary_invention_edit = input.primary_invention()
        antigen = input.antigen()
        disease = input.disease()
        response = generate_field_of_invention(primary_invention_edit, antigen, disease)

        shared_state["field_of_invention_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated field of invention")
        ui.update_action_button("primary_invention_continue", disabled=True)
        ui.update_action_button("field_of_invention_continue", disabled=False)
        generated_field_of_invention.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.field_of_invention_continue)
    def on_field_of_invention_continue():
        field_of_invention_edit = input.field_of_invention()
        antigen = input.antigen()
        disease = input.disease()       
        response = generate_background_and_need(field_of_invention_edit, antigen, disease)

        shared_state["background_and_need_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated background and need")
        ui.update_action_button("field_of_invention_continue", disabled=True)
        ui.update_action_button("background_continue", disabled=False)
        generated_background.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.background_continue)
    def on_background_continue():
        background_edit = input.background()
        antigen = input.antigen()
        disease = input.disease()
        response = generate_brief_summary(background_edit, antigen, disease)

        shared_state["brief_summary_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated brief summary")
        ui.update_action_button("background_continue", disabled=True)
        ui.update_action_button("summary_continue", disabled=False)
        generated_summary.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.summary_continue)
    def on_summary_continue():  
        summary_edit = input.summary()
        antigen = input.antigen()
        disease = input.disease()
        response = generate_technology_platform(summary_edit, antigen, disease)

        shared_state["technology_platform_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated technology platform")
        ui.update_action_button("summary_continue", disabled=True)
        ui.update_action_button("technology_continue", disabled=False)
        generated_technology.set(response.prediction)
        
    @reactive.Effect
    @reactive.event(input.technology_continue)
    def on_technology_continue():
        technology_edit = input.technology()
        antigen = input.antigen()
        disease = input.disease()
        response = generate_description_of_invention(technology_edit, antigen, disease)

        shared_state["description_of_invention_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated description of invention")
        ui.update_action_button("technology_continue", disabled=True)
        ui.update_action_button("description_continue", disabled=False)
        generated_description.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.description_continue)
    def on_description_continue():
        description_edit = input.description()
        antigen = input.antigen()
        disease = input.disease()
        response = generate_product_or_products(description_edit, antigen, disease)

        shared_state["product_or_products_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated product or products")
        ui.update_action_button("description_continue", disabled=True)
        ui.update_action_button("product_continue", disabled=False)
        generated_product.set(response.prediction)

    @reactive.Effect
    @reactive.event(input.product_continue)
    def on_product_continue():
        product_edit = input.product()
        antigen = input.antigen()
        disease = input.disease()
        response = generate_uses(product_edit, antigen, disease)

        shared_state["uses_trace"] = langfuse.trace(id=response.trace_id)

        logging.info(f"Generated uses")
        ui.update_action_button("product_continue", disabled=True)
        ui.update_action_button("uses_continue", disabled=False)
        generated_uses.set(response.prediction)


    # Use render.ui to auto-refresh content when generated_content changes
    @output
    @render.ui
    def primary_invention_card():
        return generate_card_content(generated_primary_invention(), "primary_invention")

    # UI renderers
    @output
    @render.ui
    def field_of_invention_card():
        return generate_card_content(generated_field_of_invention(), "field_of_invention")

    @output
    @render.ui
    def background_card():
        return generate_card_content(generated_background(), "background")

    @output
    @render.ui
    def summary_card():
        return generate_card_content(generated_summary(), "summary")

    @output
    @render.ui
    def technology_card():
        return generate_card_content(generated_technology(), "technology")

    @output
    @render.ui
    def description_card():
        return generate_card_content(generated_description(), "description")

    @output
    @render.ui
    def product_card():
        return generate_card_content(generated_product(), "product")

    @output
    @render.ui
    def uses_card():
        return generate_card_content(generated_uses(), "uses")

    @reactive.Effect
    @reactive.event(input.thumbs_up_primary_invention)
    def on_thumbs_up():
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.notification_show("thumbs up_primary_invention", duration=2, type="message")

        trace = shared_state["primary_invention_trace"]

        if trace:
            trace.update(metadata={"feedback":"positive"})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down_primary_invention)
    def on_thumbs_down():
        ui.update_action_button("thumbs_up_primary_invention", disabled=True)
        ui.update_action_button("thumbs_down_primary_invention", disabled=True)
        ui.notification_show("thumbs down_primary_invention", duration=2, type="error")

        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.update(metadata={"feedback":"negative"})
        print("thumbs down")


    @reactive.Effect()
    @reactive.event(input.primary_invention)
    def on_editable_content():
        print("watching changes...")
        if input.primary_invention() != "":
            print("content changed!")
            ui.update_action_button("save_primary_invention", disabled=False)


    @reactive.Effect
    @reactive.event(input.save_primary_invention)
    def on_save():
        print("save")
        ui.update_action_button("save_primary_invention", disabled=True)

        primary_invention_edit = input.primary_invention()
        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(name="edit_primary_invention", input="The input to this event is the primary invention generated by the LLM", output=primary_invention_edit)

    @reactive.Effect
    @reactive.event(input.save_reasoning_primary_invention)
    def on_save_reasoning_primary_invention():
        print("save reasoning")
        reasoning = input.reasoning_primary_invention()

        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(
            name="edit_reasoning_primary_invention",
            input="the user comments on the primary invention and the changes they made",
            output=reasoning,
        )

        ui.update_action_button("save_reasoning_primary_invention", disabled=True)

    @reactive.Effect
    @reactive.event(input.save_reasoning_thumbs_down_primary_invention)
    def on_save_reasoning_thumbs_down():
        print("save thumbs down reasoning")
        reasoning = input.reasoning_thumbs_down_primary_invention()
        trace = shared_state["primary_invention_trace"]
        if trace:
            trace.event(
                name="thumbs_down_reasoning_primary_invention",
                input="the user provides negative feedback",
                output=reasoning,
            )
        ui.update_action_button("save_reasoning_thumbs_down_primary_invention", disabled=True)    

# Run App
app = shiny.App(app_ui, server)
app.run()

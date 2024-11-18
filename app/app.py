from shiny import reactive, render, ui
import shiny
import asyncio
from make_patent_component import primary_invention, trace_id, langfuse
import logging


logging.basicConfig(level=logging.INFO)

# Define UI
app_ui = ui.page_fluid(
    ui.layout_sidebar(
        ui.sidebar(
            ui.input_text("antigen", "Enter Antigen"),
            ui.input_text("disease", "Enter Disease"),
            ui.input_action_button("generate", "Generate", class_="btn btn-primary"),
        ),
        ui.card(
            ui.output_ui("content_cards", height="100%", padding="0"),
            max_height="50%",
            class_="p-0"# Placeholder for dynamically generated cards
        ),
        height="100vh",
    )
)


def generate_card_content(response_text):
    response_text = str(response_text)
    return ui.div(
        ui.div(
            ui.input_text_area(
                "primary_invention", 
                "primary invention", 
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
                "thumbs_up", "👍 ", class_="btn btn-success p-0", width="3vw"
            ),
            ui.input_action_button(
                "thumbs_down", "👎 ", class_="btn btn-danger p-0", width="3vw"
            ),
            ui.popover(
                ui.input_action_button(
                    "save", "💾 ", class_="btn btn-secondary p-0", width="3vw", disabled=True
                ),
                ui.input_text_area(
                    "reasoning_primary_invention", 
                    "primary invention",
                    height="30vh",
                    width="30vw",
                    resize="none",
                    spellcheck=True,
                    placeholder="Please provide reasoning for your edits and/or feedback if applicable. this will help us improve the quality of our LLM",
                    
                ),
                id="primary_invention_popover"
            ),
            class_="card-footer mt-2",
        ),
        class_="card h-100 p-0",
    )


# Define Server Logic
def server(input, output, session):
    primary_invention_trace = langfuse.trace(id=trace_id)
    # Create a reactive value to store the generated content
    generated_content = reactive.Value("")
    
    @reactive.Effect
    @reactive.event(input.generate)
    async def on_generate():
        # Collect input values
        antigen = input.antigen()
        disease = input.disease()

        if not antigen and not disease:
            ui.notification_show("missing antigen and disease", duration=2, type="error")
            return 
        if not antigen:
            ui.notification_show("missing antigen", duration=2, type="error")
            return 
        if not disease:
            ui.notification_show("missing disease", duration=2, type="error")
            return 

        # Call primary_invention function with await, passing input values
        # response = 
        response = "test"

        # Debugging: Log the type and value of response
        logging.info(f"Type of response: {type(response)}")
        logging.info(f"Value of response: {response}")

        # Update reactive value
        generated_content.set(response)

    # Use render.ui to auto-refresh content when generated_content changes
    @output
    @render.ui
    def content_cards():
        return generate_card_content(generated_content())
    
    @reactive.Effect
    @reactive.event(input.thumbs_up)
    def on_thumbs_up():
        ui.update_action_button("thumbs_down", disabled=True)
        ui.update_action_button("thumbs_up", disabled=True)
        ui.notification_show("thumbs up", duration=2, type="message")

        primary_invention_trace.update(metadata={"thumbs_down":False, "thumbs_up":True})
        print("thumbs up")

    @reactive.Effect
    @reactive.event(input.thumbs_down)
    def on_thumbs_down():
        ui.update_action_button("thumbs_up", disabled=True)
        ui.update_action_button("thumbs_down", disabled=True)
        ui.notification_show("thumbs down", duration=2, type="error")

        primary_invention_trace.update(metadata={"thumbs_down":True, "thumbs_up":False})
        print("thumbs down")


    @reactive.Effect()
    @reactive.event(input.primary_invention)
    def on_editable_content():
        print("watching changes...")
        if input.primary_invention() != "":
            print("content changed!")
            ui.update_action_button("save", disabled=False)
        

    @reactive.Effect
    @reactive.event(input.save)
    def on_save():
        print("save")
        ui.update_action_button("save", disabled=True)

        primary_invention_edit = input.primary_invention()
        primary_invention_trace.event(name="edit_primary_invention", input="The input to this event is the primary invention generated by the LLM", output=primary_invention_edit)


# Run App
app = shiny.App(app_ui, server)
app.run()
